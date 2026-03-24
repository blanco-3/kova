export type Locale = "en" | "ko";

type StatusKey =
  | "created"
  | "hash_committed"
  | "completed"
  | "refunded"
  | "disputed"
  | "lost";

type ScenarioKey = "success" | "timeout" | "no_escrow";

type TimelineKey =
  | "402 issued"
  | "escrow created"
  | "hash committed"
  | "result delivered"
  | "released"
  | "refunded"
  | "disputed"
  | "lost";

const COPY = {
  en: {
    hero: {
      eyebrow: "Seoulana WarmUp / Agent Commerce Infra",
      headline: "Payment should follow delivery, not precede it.",
      summary:
        "x402 solved HTTP-native payment transport for agents. The missing layer is atomic service delivery: buyers need their funds held until the delivered result is objectively verifiable. This dashboard frames that gap through a direct before-and-after demo.",
      ribbons: ["PDA Vaults", "SHA-256 Commit", "Dual Timeout", "Devnet USDC"],
      riskLabel: "Without Escrow",
      riskHeadline: "Payment clears before delivery is proven.",
      riskBody:
        "A direct x402 flow settles immediately. If the service stalls or fails, the buyer has no recovery path and loses funds silently.",
      safeLabel: "With x402 Escrow",
      safeHeadline: "Funds release only after delivery verification.",
      safeBody:
        "The middleware swaps direct settlement for a Solana vault. Payment releases on hash match or refunds on timeout - always auditable.",
      stats: [
        { label: "Chain", value: "Solana devnet" },
        { label: "Asset", value: "USDC-SPL" },
        { label: "Pattern", value: "Commit, verify, release" },
        { label: "Fallback", value: "Automatic refund path" },
      ],
      language: "Language",
    },
    vault: {
      safeFlow: "Escrowed Flow",
      riskFlow: "Direct Payment",
      buyerWallet: "Buyer Wallet",
      serviceEndpoint: "Service Endpoint",
      vault: "Escrow PDA Vault",
      hashCommitted: "Hash Committed",
      awaitingCommit: "Awaiting Commit",
      bypassed: "Bypassed",
      verified: "Verified",
      stalled: "Stalled",
      fundsLost: "Funds Lost",
      released: "Released",
    },
    demo: {
      sectionLabel: "Live Demo Controls",
      title: "Three scenarios. One question answered.",
      description:
        "Does x402 settle before delivery, or only after delivery is proven? Run each flow and watch the difference in real-time.",
      checklist: [
        "Start with direct payment baseline",
        "Run the escrowed honest trade",
        "Trigger the delivery failure protection flow",
      ],
      prompt: "Demo Request",
      promptPlaceholder: "Enter a test prompt for the demo...",
      buttons: {
        success: "Honest Trade",
        timeout: "Delivery Failure Protection",
        noEscrow: "Without Escrow",
        running: "Running...",
      },
      apiEndpoint: "API Endpoint",
      totalRuns: "Total Runs",
    },
    comparison: {
      sectionLabel: "Before / After",
      title: "Same request. Two settlement outcomes.",
      description:
        "The left lane shows why direct x402 is fragile. The right lane shows the escrowed path that converts failure into an explicit refund.",
    },
    tracker: {
      sectionLabel: "Live Board",
      title: "Escrow Lifecycle Tracker",
      empty: "No escrows recorded yet. Run a scenario to see the lifecycle.",
      legend: "Created -> HashCommitted -> Completed / Refunded / Disputed",
      headers: ["Escrow", "Route", "Amount", "Hash", "Status"],
    },
    metrics: {
      created: {
        label: "Escrows created",
        caption: "Successful and refunded runs both count as protected x402 requests",
      },
      ratio: {
        label: "Release / refund",
        caption:
          "A failed delivery now resolves to an observable refund path instead of silent loss",
      },
      lifecycle: {
        label: "Median lifecycle",
        caption:
          "Measured from run creation to terminal settlement in the middleware registry",
      },
    },
    common: {
      step: "Step",
      none: "none",
      running: "running",
      na: "n/a",
      english: "English",
      korean: "한국어",
    },
  },
  ko: {
    hero: {
      eyebrow: "Seoulana WarmUp / 에이전트 커머스 인프라",
      headline: "결제는 전달보다 먼저 이뤄지면 안 됩니다.",
      summary:
        "x402는 에이전트를 위한 HTTP 네이티브 결제를 가능하게 했습니다. 빠진 레이어는 서비스 전달의 원자성입니다. 구매자는 전달된 결과가 객관적으로 검증될 때까지 자금이 묶여 있어야 합니다. 이 대시보드는 그 간극을 전후 비교 데모로 보여줍니다.",
      ribbons: ["PDA 볼트", "SHA-256 커밋", "듀얼 타임아웃", "Devnet USDC"],
      riskLabel: "에스크로 없음",
      riskHeadline: "서비스 전달이 증명되기 전에 결제가 끝납니다.",
      riskBody:
        "직접 x402 흐름은 즉시 정산됩니다. 서비스가 멈추거나 실패하면 구매자는 복구 경로 없이 자금을 잃습니다.",
      safeLabel: "x402 에스크로 사용",
      safeHeadline: "전달 검증 후에만 자금이 릴리즈됩니다.",
      safeBody:
        "미들웨어가 직접 정산을 솔라나 볼트 기반 에스크로로 바꿉니다. 해시가 맞으면 릴리즈되고 타임아웃이면 환불되며, 전부 온체인으로 추적 가능합니다.",
      stats: [
        { label: "체인", value: "Solana devnet" },
        { label: "자산", value: "USDC-SPL" },
        { label: "패턴", value: "커밋, 검증, 릴리즈" },
        { label: "보호", value: "자동 환불 경로" },
      ],
      language: "언어",
    },
    vault: {
      safeFlow: "에스크로 흐름",
      riskFlow: "직접 결제",
      buyerWallet: "구매자 지갑",
      serviceEndpoint: "서비스 엔드포인트",
      vault: "Escrow PDA Vault",
      hashCommitted: "해시 커밋 완료",
      awaitingCommit: "커밋 대기 중",
      bypassed: "우회됨",
      verified: "검증 완료",
      stalled: "응답 없음",
      fundsLost: "자금 손실",
      released: "릴리즈 완료",
    },
    demo: {
      sectionLabel: "라이브 데모 컨트롤",
      title: "세 가지 시나리오, 하나의 질문.",
      description:
        "x402가 전달보다 먼저 정산되는지, 아니면 전달이 증명된 뒤에만 정산되는지를 실시간으로 확인해보세요.",
      checklist: [
        "직접 결제 베이스라인부터 시작",
        "에스크로를 거친 정상 거래 실행",
        "전달 실패 보호 시나리오 실행",
      ],
      prompt: "데모 요청 예시",
      promptPlaceholder: "데모에 사용할 테스트 프롬프트를 입력하세요...",
      buttons: {
        success: "정상 거래",
        timeout: "전달 실패 보호",
        noEscrow: "에스크로 없음",
        running: "실행 중...",
      },
      apiEndpoint: "API 엔드포인트",
      totalRuns: "총 실행 수",
    },
    comparison: {
      sectionLabel: "비교",
      title: "같은 요청, 완전히 다른 정산 결과.",
      description:
        "왼쪽은 직접 x402가 왜 취약한지 보여주고, 오른쪽은 에스크로 경로가 실패를 명시적 환불로 바꾸는 과정을 보여줍니다.",
    },
    tracker: {
      sectionLabel: "라이브 보드",
      title: "에스크로 라이프사이클 트래커",
      empty: "아직 기록된 에스크로가 없습니다. 시나리오를 실행해 흐름을 확인하세요.",
      legend: "생성 -> 해시 커밋 -> 완료 / 환불 / 분쟁",
      headers: ["에스크로", "경로", "금액", "해시", "상태"],
    },
    metrics: {
      created: {
        label: "생성된 에스크로",
        caption: "성공과 환불 모두 보호된 x402 요청으로 집계됩니다",
      },
      ratio: {
        label: "릴리즈 / 환불",
        caption: "전달 실패도 이제는 침묵 속 손실이 아니라 명시적 환불 경로로 정리됩니다",
      },
      lifecycle: {
        label: "중간 라이프사이클",
        caption: "미들웨어 run registry에서 생성부터 최종 정산까지 측정한 값입니다",
      },
    },
    common: {
      step: "단계",
      none: "없음",
      running: "진행 중",
      na: "없음",
      english: "English",
      korean: "한국어",
    },
  },
} as const;

const STATUS_LABELS: Record<Locale, Record<StatusKey, string>> = {
  en: {
    created: "Created",
    hash_committed: "Committed",
    completed: "Completed",
    refunded: "Refunded",
    disputed: "Disputed",
    lost: "Lost",
  },
  ko: {
    created: "생성",
    hash_committed: "커밋됨",
    completed: "완료",
    refunded: "환불",
    disputed: "분쟁",
    lost: "손실",
  },
};

const SCENARIO_LABELS: Record<Locale, Record<ScenarioKey, string>> = {
  en: {
    success: "Honest Trade",
    timeout: "Delivery Failure Protection",
    no_escrow: "Without Escrow",
  },
  ko: {
    success: "정상 거래",
    timeout: "전달 실패 보호",
    no_escrow: "에스크로 없음",
  },
};

const TIMELINE_LABELS: Record<Locale, Record<TimelineKey, string>> = {
  en: {
    "402 issued": "402 issued",
    "escrow created": "escrow created",
    "hash committed": "hash committed",
    "result delivered": "result delivered",
    released: "released",
    refunded: "refunded",
    disputed: "disputed",
    lost: "lost",
  },
  ko: {
    "402 issued": "402 발행",
    "escrow created": "에스크로 생성",
    "hash committed": "해시 커밋",
    "result delivered": "결과 전달",
    released: "릴리즈",
    refunded: "환불",
    disputed: "분쟁",
    lost: "손실",
  },
};

const ROUTES: Record<Locale, Record<string, string>> = {
  en: {
    "buyer agent -> honest translator": "buyer agent -> honest translator",
    "buyer agent -> malicious endpoint": "buyer agent -> delivery-failure endpoint",
    "buyer agent -> delivery-failure endpoint":
      "buyer agent -> delivery-failure endpoint",
    "buyer agent -> direct x402 endpoint": "buyer agent -> direct x402 endpoint",
  },
  ko: {
    "buyer agent -> honest translator": "구매자 에이전트 -> 정상 번역 서버",
    "buyer agent -> malicious endpoint": "구매자 에이전트 -> 전달 실패 엔드포인트",
    "buyer agent -> delivery-failure endpoint":
      "구매자 에이전트 -> 전달 실패 엔드포인트",
    "buyer agent -> direct x402 endpoint": "구매자 에이전트 -> 직접 x402 엔드포인트",
  },
};

const EXACT_RUNTIME_TEXT: Record<string, string> = {
  "Run accepted": "실행이 접수되었습니다",
  "Honest server returned x402 payment instructions":
    "정상 서버가 x402 결제 요구를 반환했습니다",
  "Malicious server returned x402 payment instructions":
    "전달 실패 서버가 x402 결제 요구를 반환했습니다",
  "Delivery-failure server returned x402 payment instructions":
    "전달 실패 서버가 x402 결제 요구를 반환했습니다",
  "Seller returned deterministic translation payload":
    "판매자가 고정된 번역 결과를 반환했습니다",
  "Matching result hash released escrow to the seller":
    "결과 해시가 일치하여 에스크로가 판매자에게 릴리즈되었습니다",
  "Seller never committed a result hash before submit deadline":
    "판매자가 제출 마감 전에 결과 해시를 커밋하지 않았습니다",
  "Client saw x402 instructions and proceeded without escrow protection":
    "클라이언트가 x402 결제 요구를 보고 에스크로 없이 진행했습니다",
  "Direct x402 payment succeeded, but the server never delivered the service result":
    "직접 x402 결제는 성공했지만 서버가 서비스 결과를 전달하지 않았습니다",
};

export function getUiCopy(locale: Locale) {
  return COPY[locale];
}

export function translateStatus(status: StatusKey, locale: Locale) {
  return STATUS_LABELS[locale][status];
}

export function translateScenario(scenario: ScenarioKey, locale: Locale) {
  return SCENARIO_LABELS[locale][scenario];
}

export function translateTimelineLabel(label: TimelineKey, locale: Locale) {
  return TIMELINE_LABELS[locale][label];
}

export function translateRoute(route: string, locale: Locale) {
  return ROUTES[locale][route] ?? route;
}

export function getDefaultPrompt(locale: Locale) {
  return locale === "ko"
    ? '다음 정책 문장을 한국어로 번역해줘: "Funds release only after service delivery is proven."'
    : 'Translate this policy line into Korean: "Funds release only after service delivery is proven."';
}

export function localeTime(locale: Locale) {
  return locale === "ko" ? "ko-KR" : "en-US";
}

export function translateRuntimeText(text: string, locale: Locale) {
  if (locale === "en") {
    return text;
  }

  if (EXACT_RUNTIME_TEXT[text]) {
    return EXACT_RUNTIME_TEXT[text];
  }

  let match = text.match(/^Escrow PDA ([A-Za-z0-9]+) funded with ([0-9.]+) USDC$/);
  if (match) {
    return `Escrow PDA ${match[1]}에 ${match[2]} USDC가 예치되었습니다`;
  }

  match = text.match(
    /^Escrow PDA ([A-Za-z0-9]+) funded before calling the (?:malicious server|delivery-failure endpoint)$/
  );
  if (match) {
    return `전달 실패 엔드포인트 호출 전에 Escrow PDA ${match[1]}에 예치되었습니다`;
  }

  match = text.match(/^Seller committed ([a-f0-9]+)$/);
  if (match) {
    return `판매자가 결과 해시 ${match[1]}를 커밋했습니다`;
  }

  match = text.match(/^Buyer verified the delivered bytes and released ([0-9.]+) USDC$/);
  if (match) {
    return `구매자가 전달된 결과를 검증하고 ${match[1]} USDC를 릴리즈했습니다`;
  }

  match = text.match(/^Submit deadline elapsed, buyer reclaimed ([0-9.]+) USDC$/);
  if (match) {
    return `제출 마감이 지나 구매자가 ${match[1]} USDC를 환불받았습니다`;
  }

  match = text.match(/^Without escrow, ([0-9.]+) USDC is no longer recoverable$/);
  if (match) {
    return `에스크로가 없어서 ${match[1]} USDC는 더 이상 회수할 수 없습니다`;
  }

  return text;
}

export function formatLifecycle(
  startedAt: string,
  completedAt: string | undefined,
  locale: Locale
) {
  const timeLocale = localeTime(locale);
  return `${new Date(startedAt).toLocaleTimeString(timeLocale)} -> ${
    completedAt
      ? new Date(completedAt).toLocaleTimeString(timeLocale)
      : getUiCopy(locale).common.running
  }`;
}
