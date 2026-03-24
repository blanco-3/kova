import type { EscrowRow } from "../components/EscrowTracker";
import type { Scenario } from "../components/SplitView";
import {
  formatLifecycle,
  getDefaultPrompt,
  getUiCopy,
  type Locale,
  translateRoute,
  translateRuntimeText,
} from "./i18n";

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

function findLatestRun(runs: DemoRun[], scenario: DemoScenario) {
  return runs.find((run) => run.scenario === scenario);
}

function shortHash(hash: string | undefined, locale: Locale) {
  if (!hash) {
    return getUiCopy(locale).common.none;
  }

  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function buildScenarioCards(runs: DemoRun[], locale: Locale): Scenario[] {
  const successRun = findLatestRun(runs, "success");
  const timeoutRun = findLatestRun(runs, "timeout");
  const noEscrowRun = findLatestRun(runs, "no_escrow");
  const copy = getUiCopy(locale);
  const noEscrowIssued = noEscrowRun?.timeline.find((item) => item.label === "402 issued");
  const noEscrowLost = noEscrowRun?.timeline.find((item) => item.label === "lost");
  const successCreated = successRun?.timeline.find((item) => item.label === "escrow created");
  const timeoutCreated = timeoutRun?.timeline.find((item) => item.label === "escrow created");
  const successCommitted = successRun?.timeline.find(
    (item) => item.label === "hash committed"
  );

  return [
    {
      key: "without",
      mode: locale === "ko" ? "에스크로 없음" : "Without Escrow",
      headline:
        locale === "ko"
          ? "직접 x402 결제는 서비스 전달이 증명되기 전에 정산됩니다."
          : "Direct x402 payment settles before service delivery is proven.",
      summary:
        noEscrowRun
          ? translateRuntimeText(noEscrowRun.reason, locale)
          : locale === "ko"
            ? "이 레인은 기본 경로를 보여줍니다. 구매자가 x402 결제를 완료해도 서버가 멈추면 결제 후에는 회수 경로가 없습니다."
            : "This lane shows the baseline: the buyer satisfies x402, the server stalls, and there is no recovery path after payment has already succeeded.",
      lanes: [
        {
          label: `${copy.common.step} 1`,
          title:
            locale === "ko"
              ? "x402가 402 Payment Required를 반환합니다"
              : "x402 issues a 402 Payment Required challenge",
          note:
            noEscrowIssued?.details
              ? translateRuntimeText(noEscrowIssued.details, locale)
              : locale === "ko"
                ? "클라이언트는 보호된 엔드포인트로부터 실제 x402 결제 요구를 받습니다."
                : "The client receives a real x402 payment requirement from the protected endpoint.",
          status: "created",
        },
        {
          label: `${copy.common.step} 2`,
          title:
            locale === "ko"
              ? "구매자는 직접 결제하지만 서비스는 여전히 사라집니다"
              : "The buyer pays directly and the service still disappears",
          note:
            noEscrowLost?.details
              ? translateRuntimeText(noEscrowLost.details, locale)
              : locale === "ko"
                ? "직접 결제가 지갑에서 빠져나간 뒤 upstream 호출이 멈추면, 에이전트는 손실만 남고 에스크로 청구 경로도 없습니다."
                : "Once the direct payment leaves the wallet, a stalled upstream call leaves the agent with lost funds and no escrow claim path.",
          status: noEscrowRun?.status ?? "lost",
        },
      ],
    },
    {
      key: "with",
      mode: locale === "ko" ? "x402 에스크로 사용" : "With x402 Escrow",
      headline:
        locale === "ko"
          ? "미들웨어가 paywall을 가로채고 직접 정산을 에스크로로 바꿉니다."
          : "The middleware intercepts the paywall and replaces direct settlement with escrow.",
      summary:
        successRun
          ? translateRuntimeText(successRun.reason, locale)
          : timeoutRun
            ? translateRuntimeText(timeoutRun.reason, locale)
            : locale === "ko"
              ? "이 레인은 자금을 PDA 기반 볼트에 묶고, 결과 해시 커밋을 기다린 뒤에만 릴리즈 또는 환불을 수행합니다."
              : "This lane holds funds in a PDA-backed vault, waits for a committed result hash, and only then releases or refunds.",
      lanes: [
        {
          label: `${copy.common.step} 1`,
          title:
            locale === "ko"
              ? "서비스 이행 전에 에스크로 볼트가 생성됩니다"
              : "Escrow vault is created before service fulfillment",
          note:
            successCreated?.details
              ? translateRuntimeText(successCreated.details, locale)
              : timeoutCreated?.details
                ? translateRuntimeText(timeoutCreated.details, locale)
                : locale === "ko"
                  ? "미들웨어가 buyer, seller, nonce로부터 볼트 PDA를 파생하고 USDC를 예치합니다."
                  : "The middleware derives a vault PDA from buyer, seller, and nonce, then escrows the USDC amount.",
          status: successRun?.status === "completed" ? "created" : timeoutRun?.status ?? "created",
        },
        {
          label: `${copy.common.step} 2`,
          title:
            locale === "ko"
              ? "판매자가 결과 해시를 온체인에 커밋합니다"
              : "Seller commits the result hash on-chain",
          note:
            successCommitted?.details
              ? translateRuntimeText(successCommitted.details, locale)
              : locale === "ko"
                ? "구매자가 최종 확정하기 전에 판매자가 SHA-256 커밋으로 전달 의도를 증명합니다."
                : "The seller proves delivery intent with a SHA-256 commitment before the buyer finalizes.",
          status: successRun?.status === "completed" ? "hash_committed" : "created",
        },
        {
          label: `${copy.common.step} 3`,
          title:
            locale === "ko"
              ? "최종 정산은 전달 결과에 따라 결정됩니다"
              : "Settlement depends on delivery outcome",
          note:
            successRun?.status === "completed"
              ? translateRuntimeText(successRun.reason, locale)
              : timeoutRun
                ? translateRuntimeText(timeoutRun.reason, locale)
                : locale === "ko"
                  ? "결과 바이트가 일치하면 판매자에게 릴리즈되고, 전달이 없으면 타임아웃 후 구매자에게 환불됩니다."
                  : "Matching bytes release escrow to the seller. Missing delivery refunds the buyer after the timeout window.",
          status:
            successRun?.status === "completed"
              ? "completed"
              : timeoutRun?.status ?? "created",
        },
      ],
    },
  ];
}

export function buildMetrics(runs: DemoRun[], locale: Locale) {
  const escrowRuns = runs.filter((run) => run.scenario !== "no_escrow");
  const completed = escrowRuns.filter((run) => run.status === "completed").length;
  const refunded = escrowRuns.filter((run) => run.status === "refunded").length;
  const copy = getUiCopy(locale);
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
      label: copy.metrics.created.label,
      value: String(escrowRuns.length),
      caption: copy.metrics.created.caption,
    },
    {
      label: copy.metrics.ratio.label,
      value: `${completed} / ${refunded}`,
      caption: copy.metrics.ratio.caption,
    },
    {
      label: copy.metrics.lifecycle.label,
      value: lifecycleDurations.length
        ? `${(medianMs / 1000).toFixed(2)}s`
        : copy.common.na,
      caption: copy.metrics.lifecycle.caption,
    },
  ];
}

export function buildEscrowRows(runs: DemoRun[], locale: Locale): EscrowRow[] {
  return runs.slice(0, 10).map((run) => ({
    id: run.id,
    pair: translateRoute(run.route, locale),
    amount: run.amount,
    lifecycle: formatLifecycle(run.startedAt, run.completedAt, locale),
    hash: shortHash(run.resultHash, locale),
    status: run.status,
  }));
}

export { getDefaultPrompt };
