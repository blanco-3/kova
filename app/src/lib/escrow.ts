import type { EscrowRow } from "../components/EscrowTracker";
import type { Scenario } from "../components/SplitView";

export type DemoScenario = "success" | "timeout" | "no_escrow";
export type DemoStatus =
  | "created"
  | "hash_committed"
  | "completed"
  | "refunded"
  | "disputed"
  | "lost";

export interface DemoTimelineItem {
  label:
    | "402 issued"
    | "escrow created"
    | "hash committed"
    | "result delivered"
    | "released"
    | "refunded"
    | "disputed"
    | "lost";
  at: string;
  status: DemoStatus;
  details: string;
}

export interface DemoRun {
  id: string;
  scenario: DemoScenario;
  status: DemoStatus;
  reason: string;
  amount: string;
  cluster: string;
  prompt: string;
  route: string;
  escrowPda?: string;
  resultHash?: string;
  resultPreview?: string;
  txSignatures: string[];
  startedAt: string;
  completedAt?: string;
  timeline: DemoTimelineItem[];
}

export const DEFAULT_PROMPT =
  "Translate 'payment only releases when service delivery is proven' into Korean.";

function findLatestRun(runs: DemoRun[], scenario: DemoScenario) {
  return runs.find((run) => run.scenario === scenario);
}

function shortHash(hash: string | undefined) {
  if (!hash) {
    return "none";
  }

  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function buildScenarioCards(runs: DemoRun[]): Scenario[] {
  const successRun = findLatestRun(runs, "success");
  const timeoutRun = findLatestRun(runs, "timeout");
  const noEscrowRun = findLatestRun(runs, "no_escrow");

  return [
    {
      key: "without",
      mode: "Without Escrow",
      headline: "Direct x402 payment settles before service delivery is proven.",
      summary:
        noEscrowRun?.reason ??
        "This lane shows the baseline: the buyer satisfies x402, the server stalls, and there is no recovery path after payment has already succeeded.",
      lanes: [
        {
          label: "Step 1",
          title: "x402 issues a 402 Payment Required challenge",
          note:
            noEscrowRun?.timeline.find((item) => item.label === "402 issued")?.details ??
            "The client receives a real x402 payment requirement from the protected endpoint.",
          status: "created",
        },
        {
          label: "Step 2",
          title: "The buyer pays directly and the service still disappears",
          note:
            noEscrowRun?.timeline.find((item) => item.label === "lost")?.details ??
            "Once the direct payment leaves the wallet, a stalled upstream call leaves the agent with lost funds and no escrow claim path.",
          status: noEscrowRun?.status ?? "lost",
        },
      ],
    },
    {
      key: "with",
      mode: "With x402 Escrow",
      headline: "The middleware intercepts the paywall and replaces direct settlement with escrow.",
      summary:
        successRun?.reason ??
        timeoutRun?.reason ??
        "This lane holds funds in a PDA-backed vault, waits for a committed result hash, and only then releases or refunds.",
      lanes: [
        {
          label: "Step 1",
          title: "Escrow vault is created before service fulfillment",
          note:
            successRun?.timeline.find((item) => item.label === "escrow created")?.details ??
            timeoutRun?.timeline.find((item) => item.label === "escrow created")?.details ??
            "The middleware derives a vault PDA from buyer, seller, and nonce, then escrows the USDC amount.",
          status: successRun?.status === "completed" ? "created" : timeoutRun?.status ?? "created",
        },
        {
          label: "Step 2",
          title: "Seller commits the result hash on-chain",
          note:
            successRun?.timeline.find((item) => item.label === "hash committed")?.details ??
            "The seller proves delivery intent with a SHA-256 commitment before the buyer finalizes.",
          status: successRun?.status === "completed" ? "hash_committed" : "created",
        },
        {
          label: "Step 3",
          title: "Settlement depends on delivery outcome",
          note:
            successRun?.status === "completed"
              ? successRun.reason
              : timeoutRun?.reason ??
                "Matching bytes release escrow to the seller. Missing delivery refunds the buyer after the timeout window.",
          status:
            successRun?.status === "completed"
              ? "completed"
              : timeoutRun?.status ?? "created",
        },
      ],
    },
  ];
}

export function buildMetrics(runs: DemoRun[]) {
  const escrowRuns = runs.filter((run) => run.scenario !== "no_escrow");
  const completed = escrowRuns.filter((run) => run.status === "completed").length;
  const refunded = escrowRuns.filter((run) => run.status === "refunded").length;
  const lifecycleDurations = escrowRuns
    .filter((run) => run.completedAt)
    .map((run) => {
      const started = Date.parse(run.startedAt);
      const finished = Date.parse(run.completedAt as string);
      return Math.max(0, finished - started);
    })
    .sort((a, b) => a - b);

  const medianMs =
    lifecycleDurations.length === 0
      ? 0
      : lifecycleDurations[Math.floor(lifecycleDurations.length / 2)];

  return [
    {
      label: "Escrows created",
      value: String(escrowRuns.length),
      caption: "Successful and refunded runs both count as protected x402 requests",
    },
    {
      label: "Release / refund",
      value: `${completed} / ${refunded}`,
      caption: "A failed delivery now resolves to an observable refund path instead of silent loss",
    },
    {
      label: "Median lifecycle",
      value: lifecycleDurations.length ? `${(medianMs / 1000).toFixed(2)}s` : "n/a",
      caption: "Measured from run creation to terminal settlement in the middleware registry",
    },
  ];
}

export function buildEscrowRows(runs: DemoRun[]): EscrowRow[] {
  return runs.slice(0, 10).map((run) => ({
    id: run.id,
    pair: run.route,
    amount: run.amount,
    lifecycle: `${new Date(run.startedAt).toLocaleTimeString()} -> ${
      run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : "running"
    }`,
    hash: shortHash(run.resultHash),
    status: run.status,
  }));
}

