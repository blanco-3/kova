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

