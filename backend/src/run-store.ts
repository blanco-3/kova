import { Redis } from "@upstash/redis";
import type { DemoRun } from "./types";

function envValue(name: string) {
  const value = process.env[name];
  return value?.trim() ? value.trim() : undefined;
}

export type RunStoreKind = "memory" | "redis";

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

  const url = envValue("UPSTASH_REDIS_REST_URL") ?? envValue("KV_REST_API_URL");
  const token =
    envValue("UPSTASH_REDIS_REST_TOKEN") ?? envValue("KV_REST_API_TOKEN");
  const prefix = envValue("RUN_STORE_PREFIX") ?? "kova:demo-runs";
  const maxRuns = Number(envValue("RUN_STORE_MAX") ?? "100");

  if (url && token) {
    singleton = new RedisRunStore({ url, token, prefix, maxRuns });
    return singleton;
  }

  singleton = new MemoryRunStore(localRuns);
  return singleton;
}
