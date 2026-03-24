import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import {
  ExactSvmScheme,
  SOLANA_DEVNET_CAIP2,
  toClientSvmSigner,
} from "@x402/svm";
import { config as loadEnv } from "dotenv";
import { z } from "zod";
import { EscrowClient } from "./escrow-client";
import { sha256Bytes, sha256Hex } from "./hash-utils";
import { readSecretKeyBytes } from "./keypair";
import type { DemoRun, DemoScenario, DemoStatus } from "./types";

interface RuntimeConfig {
  honestServerUrl?: string;
  maliciousServerUrl?: string;
  programId: string;
  rpcUrl: string;
  mint: string;
  buyerKeypairPath?: string;
  buyerKeypairJson?: string;
  sellerKeypairPath?: string;
  sellerKeypairJson?: string;
  amountUsdc: number;
  syncDemoRuns: boolean;
}

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
]) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

const runSchema = z.object({
  scenario: z.enum(["success", "timeout", "no_escrow"]),
  prompt: z.string().min(1).max(240),
});

function resolveConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    honestServerUrl:
      overrides.honestServerUrl ??
      process.env.HONEST_SERVER_URL ??
      (process.env.VERCEL ? undefined : "http://127.0.0.1:8788"),
    maliciousServerUrl:
      overrides.maliciousServerUrl ??
      process.env.MALICIOUS_SERVER_URL ??
      (process.env.VERCEL ? undefined : "http://127.0.0.1:8789"),
    programId:
      overrides.programId ??
      process.env.ESCROW_PROGRAM_ID ??
      "CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH",
    rpcUrl:
      overrides.rpcUrl ?? process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    mint:
      overrides.mint ??
      process.env.DEVNET_USDC_MINT ??
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    buyerKeypairPath:
      overrides.buyerKeypairPath ??
      process.env.BUYER_KEYPAIR_PATH ??
      process.env.ANCHOR_WALLET,
    buyerKeypairJson:
      overrides.buyerKeypairJson ?? process.env.BUYER_KEYPAIR_JSON,
    sellerKeypairPath:
      overrides.sellerKeypairPath ?? process.env.SELLER_KEYPAIR_PATH,
    sellerKeypairJson:
      overrides.sellerKeypairJson ?? process.env.SELLER_KEYPAIR_JSON,
    amountUsdc:
      overrides.amountUsdc ?? Number(process.env.DIRECT_X402_PRICE_USD ?? "0.05"),
    syncDemoRuns:
      overrides.syncDemoRuns ??
      ["1", "true", "yes"].includes((process.env.SYNC_DEMO_RUNS ?? "").toLowerCase()),
  };
}

function clusterLabel(rpc: string): string {
  if (rpc.includes("127.0.0.1") || rpc.includes("localhost")) {
    return "localnet";
  }

  if (rpc.includes("devnet")) {
    return "devnet";
  }

  return "custom";
}

function nowIso(): string {
  return new Date().toISOString();
}

function routeLabel(scenario: DemoScenario): string {
  switch (scenario) {
    case "success":
      return "buyer agent -> honest translator";
    case "timeout":
      return "buyer agent -> delivery-failure endpoint";
    case "no_escrow":
      return "buyer agent -> direct x402 endpoint";
  }
}

function resolveBaseUrl(
  req: express.Request,
  explicit: string | undefined,
  fallbackPath: string
) {
  if (explicit) {
    return explicit;
  }

  const host = req.get("host");
  const protocol = req.protocol || "https";

  if (!host) {
    throw new Error(`Cannot derive public URL for ${fallbackPath}`);
  }

  return `${protocol}://${host}${fallbackPath}`;
}

export function createMiddlewareApp(overrides: Partial<RuntimeConfig> = {}) {
  const config = resolveConfig(overrides);
  const amountAtomic = Math.round(config.amountUsdc * 1_000_000);
  const app = express();
  app.set("trust proxy", true);
  app.use(cors());
  app.use(express.json());

  if (
    (!config.buyerKeypairPath && !config.buyerKeypairJson) ||
    (!config.sellerKeypairPath && !config.sellerKeypairJson)
  ) {
    throw new Error(
      "Set buyer and seller keypair path or JSON before starting the middleware"
    );
  }

  const escrowClient = new EscrowClient({
    rpcUrl: config.rpcUrl,
    programId: config.programId,
    mint: config.mint,
    buyerKeypairPath: config.buyerKeypairPath,
    buyerKeypairJson: config.buyerKeypairJson,
    sellerKeypairPath: config.sellerKeypairPath,
    sellerKeypairJson: config.sellerKeypairJson,
  });

  const runs = new Map<string, DemoRun>();

  function createRun(scenario: DemoScenario, prompt: string): DemoRun {
    const id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const run: DemoRun = {
      id,
      scenario,
      prompt,
      route: routeLabel(scenario),
      amount: `${config.amountUsdc.toFixed(2)} USDC`,
      cluster: clusterLabel(config.rpcUrl),
      status: "created",
      reason: "Run accepted",
      txSignatures: [],
      startedAt: nowIso(),
      timeline: [],
    };

    runs.set(id, run);
    return run;
  }

  function updateRun(runId: string, updates: Partial<DemoRun>) {
    const current = runs.get(runId);
    if (!current) {
      return;
    }

    runs.set(runId, { ...current, ...updates });
  }

  function pushTimeline(
    runId: string,
    label: DemoRun["timeline"][number]["label"],
    status: DemoStatus,
    details: string
  ) {
    const current = runs.get(runId);
    if (!current) {
      return;
    }

    runs.set(runId, {
      ...current,
      timeline: [
        ...current.timeline,
        {
          label,
          status,
          details,
          at: nowIso(),
        },
      ],
    });
  }

  async function loadBuyerSigner() {
    const bytes = readSecretKeyBytes(
      {
        path: config.buyerKeypairPath,
        json: config.buyerKeypairJson,
      },
      "buyer"
    );

    return toClientSvmSigner(await createKeyPairSignerFromBytes(bytes));
  }

  async function raw402Request(url: string, prompt: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (response.status !== 402) {
      throw new Error(`Expected x402 Payment Required, received ${response.status}`);
    }

    return response;
  }

  async function runSuccessScenario(
    run: DemoRun,
    endpoints: { honestServerUrl: string }
  ) {
    await raw402Request(`${endpoints.honestServerUrl}/direct`, run.prompt);
    pushTimeline(run.id, "402 issued", "created", "Honest server returned x402 payment instructions");

    const submitDeadline = Math.floor(Date.now() / 1000) + 8;
    const verifyDeadline = submitDeadline + 20;
    const created = await escrowClient.createEscrow({
      amount: amountAtomic,
      submitDeadline,
      verifyDeadline,
    });

    updateRun(run.id, {
      status: "created",
      reason: "Escrow funded and waiting on service delivery",
      escrowPda: created.escrowPda.toBase58(),
      txSignatures: [created.signature],
    });
    pushTimeline(
      run.id,
      "escrow created",
      "created",
      `Escrow PDA ${created.escrowPda.toBase58()} funded with ${config.amountUsdc.toFixed(2)} USDC`
    );

    const resultResponse = await fetch(`${endpoints.honestServerUrl}/escrow/fulfill`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: run.prompt, escrowPda: created.escrowPda.toBase58() }),
    });

    if (!resultResponse.ok) {
      throw new Error(`Honest server returned ${resultResponse.status}`);
    }

    const result = await resultResponse.text();
    const resultHash = sha256Hex(result);
    const commitSignature = await escrowClient.commitResultHash(
      created.escrowPda,
      sha256Bytes(result)
    );
    updateRun(run.id, {
      status: "hash_committed",
      resultHash,
      txSignatures: [...(runs.get(run.id)?.txSignatures ?? []), commitSignature],
    });
    pushTimeline(
      run.id,
      "hash committed",
      "hash_committed",
      `Seller committed ${resultHash}`
    );
    pushTimeline(
      run.id,
      "result delivered",
      "hash_committed",
      "Seller returned deterministic translation payload"
    );

    const releaseSignature = await escrowClient.verifyAndRelease(
      created.escrowPda,
      created.vaultAta,
      created.sellerAta,
      Buffer.from(result)
    );

    updateRun(run.id, {
      status: "completed",
      reason: "Matching result hash released escrow to the seller",
      resultPreview: result,
      completedAt: nowIso(),
      txSignatures: [...(runs.get(run.id)?.txSignatures ?? []), releaseSignature],
    });
    pushTimeline(
      run.id,
      "released",
      "completed",
      `Buyer verified the delivered bytes and released ${config.amountUsdc.toFixed(2)} USDC`
    );
  }

  async function runTimeoutScenario(
    run: DemoRun,
    endpoints: { maliciousServerUrl: string }
  ) {
    await raw402Request(`${endpoints.maliciousServerUrl}/direct`, run.prompt);
    pushTimeline(
      run.id,
      "402 issued",
      "created",
      "Delivery-failure server returned x402 payment instructions"
    );

    const submitDeadline = Math.floor(Date.now() / 1000) + 8;
    const verifyDeadline = submitDeadline + 20;
    const created = await escrowClient.createEscrow({
      amount: amountAtomic,
      submitDeadline,
      verifyDeadline,
    });

    updateRun(run.id, {
      status: "created",
      reason: "Escrow funded and waiting for a result that never arrives",
      escrowPda: created.escrowPda.toBase58(),
      txSignatures: [created.signature],
    });
    pushTimeline(
      run.id,
      "escrow created",
      "created",
      `Escrow PDA ${created.escrowPda.toBase58()} funded before calling the delivery-failure endpoint`
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_500);

    try {
      await fetch(`${endpoints.maliciousServerUrl}/escrow/fulfill`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: run.prompt, escrowPda: created.escrowPda.toBase58() }),
        signal: controller.signal,
      });
    } catch {
      // Expected timeout path for the malicious endpoint.
    } finally {
      clearTimeout(timer);
    }

    await new Promise((resolve) => setTimeout(resolve, 6_000));

    const refundSignature = await escrowClient.claimBuyerRefund(
      created.escrowPda,
      created.vaultAta,
      created.buyerAta,
      created.sellerAta
    );

    updateRun(run.id, {
      status: "refunded",
      reason: "Seller never committed a result hash before submit deadline",
      completedAt: nowIso(),
      txSignatures: [...(runs.get(run.id)?.txSignatures ?? []), refundSignature],
    });
    pushTimeline(
      run.id,
      "refunded",
      "refunded",
      `Submit deadline elapsed, buyer reclaimed ${config.amountUsdc.toFixed(2)} USDC`
    );
  }

  async function runNoEscrowScenario(
    run: DemoRun,
    endpoints: { maliciousServerUrl: string }
  ) {
    await raw402Request(`${endpoints.maliciousServerUrl}/direct`, run.prompt);
    pushTimeline(
      run.id,
      "402 issued",
      "created",
      "Client saw x402 instructions and proceeded without escrow protection"
    );

    const signer = await loadBuyerSigner();
    const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [
        {
          network: SOLANA_DEVNET_CAIP2,
          client: new ExactSvmScheme(signer),
        },
      ],
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);

    try {
      await fetchWithPayment(`${endpoints.maliciousServerUrl}/direct`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: run.prompt }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
    } finally {
      clearTimeout(timer);
    }

    updateRun(run.id, {
      status: "lost",
      reason: "Direct x402 payment succeeded, but the server never delivered the service result",
      completedAt: nowIso(),
    });
    pushTimeline(
      run.id,
      "lost",
      "lost",
      `Without escrow, ${config.amountUsdc.toFixed(2)} USDC is no longer recoverable`
    );
  }

  async function executeRun(
    run: DemoRun,
    endpoints: { honestServerUrl: string; maliciousServerUrl: string }
  ) {
    try {
      if (run.scenario === "success") {
        await runSuccessScenario(run, { honestServerUrl: endpoints.honestServerUrl });
        return;
      }

      if (run.scenario === "timeout") {
        await runTimeoutScenario(run, { maliciousServerUrl: endpoints.maliciousServerUrl });
        return;
      }

      await runNoEscrowScenario(run, { maliciousServerUrl: endpoints.maliciousServerUrl });
    } catch (error) {
      updateRun(run.id, {
        status: run.scenario === "no_escrow" ? "lost" : "disputed",
        reason: error instanceof Error ? error.message : "Unknown execution error",
        completedAt: nowIso(),
      });
      pushTimeline(
        run.id,
        run.scenario === "no_escrow" ? "lost" : "disputed",
        run.scenario === "no_escrow" ? "lost" : "disputed",
        error instanceof Error ? error.message : "Unknown execution error"
      );
    }
  }

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({
      ok: true,
      cluster: clusterLabel(config.rpcUrl),
      honestServerUrl: config.honestServerUrl ?? "derived-per-request",
      maliciousServerUrl: config.maliciousServerUrl ?? "derived-per-request",
      syncDemoRuns: config.syncDemoRuns,
    });
  });

  app.get(["/escrows", "/api/escrows"], (_req, res) => {
    const list = [...runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    res.json(list);
  });

  app.get(["/escrows/:id", "/api/escrows/:id"], (req, res) => {
    const runId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const run = runId ? runs.get(runId) : undefined;
    if (!run) {
      return res.status(404).json({ error: "not_found" });
    }

    return res.json(run);
  });

  app.post(["/demo/run", "/api/demo/run"], async (req, res) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "invalid_request",
        details: parsed.error.flatten(),
      });
    }

    const run = createRun(parsed.data.scenario, parsed.data.prompt);
    const endpoints = {
      honestServerUrl: resolveBaseUrl(
        req,
        config.honestServerUrl,
        "/api/demo/honest"
      ),
      maliciousServerUrl: resolveBaseUrl(
        req,
        config.maliciousServerUrl,
        "/api/demo/malicious"
      ),
    };

    if (config.syncDemoRuns) {
      await executeRun(run, endpoints);
      return res.status(200).json(runs.get(run.id) ?? run);
    }

    void executeRun(run, endpoints);
    return res.status(202).json(run);
  });

  return app;
}
