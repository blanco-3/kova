import { Firestore } from "@google-cloud/firestore";
import { del, list, put } from "@vercel/blob";
import { Redis } from "@upstash/redis";
import type { DemoRun } from "./types";

function envValue(name: string) {
  const value = process.env[name];
  return value?.trim() ? value.trim() : undefined;
}

export type RunStoreKind = "memory" | "redis" | "blob" | "firestore";

export interface RunStore {
  readonly kind: RunStoreKind;
  save(run: DemoRun): Promise<void>;
  get(id: string): Promise<DemoRun | null>;
  list(limit?: number): Promise<DemoRun[]>;
}

class MemoryRunStore implements RunStore {
  readonly kind = "memory" as const;

  constructor(private readonly runs: Map<string, DemoRun>) {}

  async save(run: DemoRun) {
    this.runs.set(run.id, run);
  }

  async get(id: string) {
    return this.runs.get(id) ?? null;
  }

  async list(limit = 50) {
    return [...this.runs.values()]
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
      .slice(0, limit);
  }
}

class FirestoreRunStore implements RunStore {
  readonly kind = "firestore" as const;
  private readonly collection;

  constructor(config: {
    projectId: string;
    collectionName: string;
    databaseId?: string;
  }) {
    const firestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.databaseId,
      ignoreUndefinedProperties: true,
    });
    this.collection = firestore.collection(config.collectionName);
  }

  async save(run: DemoRun) {
    await this.collection.doc(run.id).set({
      ...run,
      startedAtEpoch: Date.parse(run.startedAt),
    });
  }

  async get(id: string) {
    const snapshot = await this.collection.doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as (DemoRun & { startedAtEpoch?: number }) | undefined;
    if (!data?.id) {
      return null;
    }

    const { startedAtEpoch: _ignored, ...run } = data;
    return run;
  }

  async list(limit = 50) {
    const snapshot = await this.collection
      .orderBy("startedAtEpoch", "desc")
      .limit(limit)
      .get();

    return snapshot.docs
      .map((doc) => {
        const data = doc.data() as (DemoRun & { startedAtEpoch?: number }) | undefined;
        if (!data?.id) {
          return null;
        }

        const { startedAtEpoch: _ignored, ...run } = data;
        return run;
      })
      .filter((run): run is DemoRun => Boolean(run));
  }
}

class BlobRunStore implements RunStore {
  readonly kind = "blob" as const;
  private readonly token: string;
  private readonly prefix: string;
  private readonly maxRuns: number;

  constructor(config: { token: string; prefix: string; maxRuns: number }) {
    this.token = config.token;
    this.prefix = config.prefix.replace(/\/+$/, "");
    this.maxRuns = config.maxRuns;
  }

  private runPath(id: string) {
    return `${this.prefix}/${id}.json`;
  }

  private async readRun(url: string) {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const body = await response.text();
    if (!body.trim()) {
      return null;
    }

    const parsed = JSON.parse(body) as DemoRun;
    return parsed?.id ? parsed : null;
  }

  private async listBlobs() {
    const result = await list({
      prefix: `${this.prefix}/`,
      token: this.token,
    });

    return [...result.blobs].sort(
      (left, right) =>
        new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime()
    );
  }

  private async trimOverflow() {
    const blobs = await this.listBlobs();
    const stale = blobs.slice(this.maxRuns);
    if (stale.length === 0) {
      return;
    }

    await del(
      stale.map((blob) => blob.pathname),
      { token: this.token }
    );
  }

  async save(run: DemoRun) {
    await put(this.runPath(run.id), JSON.stringify(run), {
      access: "public",
      token: this.token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    await this.trimOverflow();
  }

  async get(id: string) {
    const match = (await this.listBlobs()).find(
      (blob) => blob.pathname === this.runPath(id)
    );

    if (!match) {
      return null;
    }

    return this.readRun(match.url);
  }

  async list(limit = 50) {
    const blobs = (await this.listBlobs()).slice(0, limit);
    const runs = await Promise.all(blobs.map((blob) => this.readRun(blob.url)));
    return runs.filter((run): run is DemoRun => Boolean(run));
  }
}

class RedisRunStore implements RunStore {
  readonly kind = "redis" as const;
  private readonly redis: Redis;
  private readonly indexKey: string;
  private readonly maxRuns: number;

  constructor(config: { url: string; token: string; prefix: string; maxRuns: number }) {
    this.redis = new Redis({
      url: config.url,
      token: config.token,
      enableTelemetry: false,
    });
    this.indexKey = `${config.prefix}:index`;
    this.maxRuns = config.maxRuns;
  }

  private runKey(id: string) {
    return `${this.indexKey}:run:${id}`;
  }

  async save(run: DemoRun) {
    const score = Date.parse(run.startedAt);
    await this.redis.set(this.runKey(run.id), run);
    await this.redis.zadd(this.indexKey, { score, member: run.id });
    await this.trimOverflow();
  }

  async get(id: string) {
    return (await this.redis.get<DemoRun>(this.runKey(id))) ?? null;
  }

  async list(limit = 50) {
    const ids = await this.redis.zrange<string[]>(this.indexKey, 0, limit - 1, {
      rev: true,
    });

    if (ids.length === 0) {
      return [];
    }

    const runs = await Promise.all(ids.map((id) => this.get(id)));
    return runs.filter((run): run is DemoRun => Boolean(run));
  }

  private async trimOverflow() {
    const count = await this.redis.zcard(this.indexKey);
    const overflow = count - this.maxRuns;

    if (overflow <= 0) {
      return;
    }

    const staleIds = await this.redis.zrange<string[]>(this.indexKey, 0, overflow - 1);

    if (staleIds.length === 0) {
      return;
    }

    await this.redis.zrem(this.indexKey, ...staleIds);
    await Promise.all(staleIds.map((id) => this.redis.del(this.runKey(id))));
  }
}

let singleton: RunStore | undefined;

export function getRunStore(localRuns: Map<string, DemoRun>) {
  if (singleton) {
    return singleton;
  }

  const backend = envValue("RUN_STORE_BACKEND")?.toLowerCase();
  const projectId =
    envValue("GOOGLE_CLOUD_PROJECT") ??
    envValue("GCLOUD_PROJECT") ??
    envValue("GCP_PROJECT");
  const firestoreCollection =
    envValue("FIRESTORE_RUN_COLLECTION") ?? "kova_demo_runs";
  const firestoreDatabaseId = envValue("FIRESTORE_DATABASE_ID");
  const blobToken = envValue("BLOB_READ_WRITE_TOKEN");
  const url = envValue("UPSTASH_REDIS_REST_URL") ?? envValue("KV_REST_API_URL");
  const token =
    envValue("UPSTASH_REDIS_REST_TOKEN") ?? envValue("KV_REST_API_TOKEN");
  const prefix = envValue("RUN_STORE_PREFIX") ?? "kova:demo-runs";
  const maxRuns = Number(envValue("RUN_STORE_MAX") ?? "100");
  const preferFirestore =
    backend === "firestore" ||
    (!backend && Boolean(envValue("K_SERVICE")) && Boolean(projectId));

  if (preferFirestore && projectId) {
    singleton = new FirestoreRunStore({
      projectId,
      collectionName: firestoreCollection,
      databaseId: firestoreDatabaseId,
    });
    return singleton;
  }

  if (blobToken) {
    singleton = new BlobRunStore({
      token: blobToken,
      prefix: "kova-demo-runs",
      maxRuns,
    });
    return singleton;
  }

  if (url && token) {
    singleton = new RedisRunStore({ url, token, prefix, maxRuns });
    return singleton;
  }

  singleton = new MemoryRunStore(localRuns);
  return singleton;
}
