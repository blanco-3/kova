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
import type { DemoRun, DemoScenario, DemoStatus } from "./types";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
]) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

const honestServerUrl = process.env.HONEST_SERVER_URL ?? "http://127.0.0.1:8788";
const maliciousServerUrl =
  process.env.MALICIOUS_SERVER_URL ?? "http://127.0.0.1:8789";
const programId =
  process.env.ESCROW_PROGRAM_ID ??
  "CTRDkdc7fN427u2p3gVHJvosy2GihnRwer5T6CM98xtH";
const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const mint =
  process.env.DEVNET_USDC_MINT ??
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const buyerKeypairPath =
  process.env.BUYER_KEYPAIR_PATH ?? process.env.ANCHOR_WALLET ?? "";
const sellerKeypairPath = process.env.SELLER_KEYPAIR_PATH ?? "";
const amountUsdc = Number(process.env.DIRECT_X402_PRICE_USD ?? "0.05");
const amountAtomic = Math.round(amountUsdc * 1_000_000);

if (!buyerKeypairPath || !sellerKeypairPath) {
  throw new Error("Set BUYER_KEYPAIR_PATH and SELLER_KEYPAIR_PATH before starting the middleware");
}

const escrowClient = new EscrowClient({
  rpcUrl,
  programId,
  mint,
  buyerKeypairPath,
  sellerKeypairPath,
});

const runs = new Map<string, DemoRun>();

const runSchema = z.object({
  scenario: z.enum(["success", "timeout", "no_escrow"]),
  prompt: z.string().min(1).max(240),
});

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
      return "buyer agent -> malicious endpoint";
    case "no_escrow":
      return "buyer agent -> direct x402 endpoint";
  }
}

function createRun(scenario: DemoScenario, prompt: string): DemoRun {
  const id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const run: DemoRun = {
    id,
    scenario,
    prompt,
    route: routeLabel(scenario),
    amount: `${amountUsdc.toFixed(2)} USDC`,
    cluster: clusterLabel(rpcUrl),
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
  const raw = fs.readFileSync(buyerKeypairPath, "utf8");
  const bytes = Uint8Array.from(JSON.parse(raw) as number[]);
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

async function runSuccessScenario(run: DemoRun) {
  await raw402Request(`${honestServerUrl}/direct`, run.prompt);
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
    `Escrow PDA ${created.escrowPda.toBase58()} funded with ${amountUsdc.toFixed(2)} USDC`
  );

  const resultResponse = await fetch(`${honestServerUrl}/escrow/fulfill`, {
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
    `Buyer verified the delivered bytes and released ${amountUsdc.toFixed(2)} USDC`
  );
}

async function runTimeoutScenario(run: DemoRun) {
  await raw402Request(`${maliciousServerUrl}/direct`, run.prompt);
  pushTimeline(
    run.id,
    "402 issued",
    "created",
    "Malicious server returned x402 payment instructions"
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
    `Escrow PDA ${created.escrowPda.toBase58()} funded before calling the malicious server`
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_500);

  try {
    await fetch(`${maliciousServerUrl}/escrow/fulfill`, {
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
    `Submit deadline elapsed, buyer reclaimed ${amountUsdc.toFixed(2)} USDC`
  );
}

async function runNoEscrowScenario(run: DemoRun) {
  await raw402Request(`${maliciousServerUrl}/direct`, run.prompt);
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
    await fetchWithPayment(`${maliciousServerUrl}/direct`, {
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
    `Without escrow, ${amountUsdc.toFixed(2)} USDC is no longer recoverable`
  );
}

async function executeRun(run: DemoRun) {
  try {
    if (run.scenario === "success") {
      await runSuccessScenario(run);
      return;
    }

    if (run.scenario === "timeout") {
      await runTimeoutScenario(run);
      return;
    }

    await runNoEscrowScenario(run);
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

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    cluster: clusterLabel(rpcUrl),
    honestServerUrl,
    maliciousServerUrl,
  });
});

app.get("/api/escrows", (_req, res) => {
  const list = [...runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  res.json(list);
});

app.get("/api/escrows/:id", (req, res) => {
  const run = runs.get(req.params.id);
  if (!run) {
    return res.status(404).json({ error: "not_found" });
  }

  return res.json(run);
});

app.post("/api/demo/run", async (req, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid_request",
      details: parsed.error.flatten(),
    });
  }

  const run = createRun(parsed.data.scenario, parsed.data.prompt);
  void executeRun(run);

  return res.status(202).json(run);
});

const port = Number(process.env.MIDDLEWARE_PORT ?? process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`x402 escrow middleware listening on http://localhost:${port}`);
});
