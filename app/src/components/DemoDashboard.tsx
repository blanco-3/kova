"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { EscrowTracker } from "./EscrowTracker";
import { SplitView } from "./SplitView";
import {
  buildEscrowRows,
  buildScenarioCards,
  getDefaultPrompt,
  type DemoRun,
  type DemoScenario,
} from "../lib/escrow";
import {
  getUiCopy,
  localeTime,
  type Locale,
  translateRuntimeText,
  translateScenario,
  translateStatus,
  translateTimelineLabel,
  translateRoute,
} from "../lib/i18n";

const apiBase =
  process.env.NEXT_PUBLIC_DEMO_API_BASE ?? "http://127.0.0.1:8787";
const localRunsKey = "x402-escrow-demo-runs";

const ACTIVE_STALE_MS = 3 * 60 * 1000; // 3 minutes — any active run older than this is stale

function isActiveRun(run: DemoRun) {
  if (run.status !== "created" && run.status !== "hash_committed") return false;
  // Don't treat very old active runs as live — they'll never resolve without a reachable middleware
  const age = Date.now() - new Date(run.startedAt).getTime();
  return age < ACTIVE_STALE_MS;
}

function sameRuns(left: DemoRun[], right: DemoRun[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const current = left[index];
    const next = right[index];

    if (
      current.id !== next.id ||
      current.status !== next.status ||
      current.reason !== next.reason ||
      current.startedAt !== next.startedAt ||
      current.completedAt !== next.completedAt ||
      current.escrowPda !== next.escrowPda ||
      current.resultHash !== next.resultHash ||
      current.resultPreview !== next.resultPreview ||
      current.route !== next.route ||
      current.amount !== next.amount ||
      current.cluster !== next.cluster
    ) {
      return false;
    }

    if (current.txSignatures.length !== next.txSignatures.length) {
      return false;
    }

    for (let signatureIndex = 0; signatureIndex < current.txSignatures.length; signatureIndex += 1) {
      if (current.txSignatures[signatureIndex] !== next.txSignatures[signatureIndex]) {
        return false;
      }
    }

    if (current.timeline.length !== next.timeline.length) {
      return false;
    }

    for (let timelineIndex = 0; timelineIndex < current.timeline.length; timelineIndex += 1) {
      const currentItem = current.timeline[timelineIndex];
      const nextItem = next.timeline[timelineIndex];

      if (
        currentItem.label !== nextItem.label ||
        currentItem.status !== nextItem.status ||
        currentItem.at !== nextItem.at ||
        currentItem.details !== nextItem.details
      ) {
        return false;
      }
    }
  }

  return true;
}

async function fetchRuns(): Promise<DemoRun[]> {
  const response = await fetch(`${apiBase}/api/escrows`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load escrows: ${response.status}`);
  }
  return response.json();
}

function mergeRuns(current: DemoRun[], incoming: DemoRun[]) {
  const merged = new Map<string, DemoRun>();
  for (const run of current) merged.set(run.id, run);
  for (const run of incoming) merged.set(run.id, run);
  return [...merged.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

function readCachedRuns() {
  if (typeof window === "undefined") return [] as DemoRun[];
  try {
    const raw = window.localStorage.getItem(localRunsKey);
    if (!raw) return [] as DemoRun[];
    const parsed = JSON.parse(raw) as DemoRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as DemoRun[];
  }
}

function shortenValue(value: string, start = 8, end = 8) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function explorerHref(kind: "tx" | "address", value: string, cluster: string) {
  if (cluster !== "devnet") {
    return undefined;
  }

  return kind === "tx"
    ? `https://explorer.solana.com/tx/${value}?cluster=devnet`
    : `https://explorer.solana.com/address/${value}?cluster=devnet`;
}

export function DemoDashboard({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const [runs, setRuns] = useState<DemoRun[]>([]);
  const [busyScenario, setBusyScenario] = useState<DemoScenario | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [hasLoadedRuns, setHasLoadedRuns] = useState(false);
  const prompt = getDefaultPrompt(locale);
  const hasActiveRuns = runs.some(isActiveRun);
  const visibleError = runError ?? refreshError;

  const refreshRuns = useEffectEvent(async () => {
    try {
      const nextRuns = await fetchRuns();
      startTransition(() => {
        setRuns((current) => {
          const merged = mergeRuns(current, nextRuns);
          return sameRuns(current, merged) ? current : merged;
        });
        setHasLoadedRuns(true);
        setRefreshError(null);
      });
    } catch (refreshError) {
      console.warn("Failed to refresh demo runs", refreshError);
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh demo runs";
      startTransition(() => {
        if (!hasLoadedRuns && runs.length === 0) {
          setRefreshError(message);
        }
      });
    }
  });

  useEffect(() => {
    startTransition(() => {
      setRuns(readCachedRuns());
    });
    void refreshRuns();
  }, [refreshRuns]);

  useEffect(() => {
    const intervalMs = hasActiveRuns ? 2_500 : runs.length > 0 ? 12_000 : 20_000;

    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      void refreshRuns();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [hasActiveRuns, refreshRuns, runs.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localRunsKey, JSON.stringify(runs.slice(0, 12)));
  }, [runs]);

  async function runScenario(scenario: DemoScenario) {
    setBusyScenario(scenario);
    setRunError(null);
    try {
      const response = await fetch(`${apiBase}/api/demo/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario, prompt }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error
            ? `Demo run rejected: ${payload.error}`
            : `Demo run failed with ${response.status}`
        );
      }
      const run = (await response.json().catch(() => null)) as DemoRun | null;
      if (run?.id) setRuns((current) => mergeRuns(current, [run]));
      await refreshRuns();
    } catch (runError) {
      setRunError(
        runError instanceof Error ? runError.message : "Failed to start demo run"
      );
    } finally {
      setBusyScenario(null);
    }
  }

  const scenarioCards = buildScenarioCards(runs, locale);
  const trackerRows = buildEscrowRows(runs, locale);
  const recentRuns = runs.slice(0, 3);

  return (
    <>
      <SplitView scenarios={scenarioCards} locale={locale} />

      <section className="demo-stage">
        <div className="control-panel">
          <div className="control-actions">
            <div className="prompt-field">
              <span className="section-label">
                {locale === "ko" ? "데모 요청 예시" : "DEMO REQUEST"}
              </span>
              <div className="prompt-preview">{prompt}</div>
            </div>

            <div className="button-row">
              <button
                className="demo-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("success")}
                type="button"
              >
                {busyScenario === "success"
                  ? copy.demo.buttons.running
                  : `✓ ${copy.demo.buttons.success}`}
              </button>
              <button
                className="demo-button danger-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("timeout")}
                type="button"
              >
                {busyScenario === "timeout"
                  ? copy.demo.buttons.running
                  : `✗ ${copy.demo.buttons.timeout}`}
              </button>
              <button
                className="demo-button ghost-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("no_escrow")}
                type="button"
              >
                {busyScenario === "no_escrow"
                  ? copy.demo.buttons.running
                  : `◎ ${copy.demo.buttons.noEscrow}`}
              </button>
            </div>

            <p className="proof-note">
              {locale === "ko"
                ? "최근 실행 보드에서 에스크로 라이프사이클과 증빙 정보를 확인할 수 있습니다. 라이브 settlement가 켜진 환경에서는 PDA와 트랜잭션 링크도 함께 표시됩니다."
                : "Review the escrow lifecycle and proof details in the recent executions board below. When live settlement is enabled, PDA and transaction links appear here as well."}
            </p>

            {visibleError && (
              <p className="error-copy">
                {translateRuntimeText(visibleError, locale)}
              </p>
            )}
          </div>
        </div>
      </section>

      <EscrowTracker escrows={trackerRows} locale={locale} />

      {recentRuns.length > 0 && (
        <section className="recent-section">
          <div className="recent-section-head">
            <p className="section-label">
              {locale === "ko" ? "최근 실행" : "RECENT EXECUTIONS"}
            </p>
            <h2>
              {locale === "ko" ? "방금 무슨 일이 일어났는가." : "What just happened."}
            </h2>
          </div>
          <div className="timeline-grid">
            {recentRuns.map((run) => (
              <article key={run.id} className="timeline-card">
                <div className="scenario-copy">
                  <div>
                    <h2
                      style={{
                        color:
                          run.scenario === "success"
                            ? "var(--teal)"
                            : run.scenario === "timeout"
                              ? "var(--orange)"
                              : "var(--red)",
                      }}
                    >
                      {run.scenario === "success"
                        ? translateScenario("success", locale)
                        : run.scenario === "timeout"
                          ? translateScenario("timeout", locale)
                          : translateScenario("no_escrow", locale)}
                    </h2>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--ink-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {translateRoute(run.route, locale)}
                    </span>
                  </div>
                  <span className={`status-pill status-${run.status}`}>
                    {translateStatus(run.status, locale)}
                  </span>
                </div>
                <p>{translateRuntimeText(run.reason, locale)}</p>
                {(run.escrowPda || run.resultHash || run.txSignatures.length > 0) && (
                  <div className="proof-strip">
                    {run.escrowPda ? (
                      <div className="proof-item">
                        <span className="proof-label">
                          {locale === "ko" ? "Escrow PDA" : "Escrow PDA"}
                        </span>
                        <div className="proof-value-row">
                          <code>{shortenValue(run.escrowPda)}</code>
                          {run.txSignatures.length > 0 &&
                          explorerHref("address", run.escrowPda, run.cluster) ? (
                            <a
                              href={explorerHref("address", run.escrowPda, run.cluster)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="proof-link"
                            >
                              {locale === "ko" ? "Explorer" : "Explorer"}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {run.resultHash ? (
                      <div className="proof-item">
                        <span className="proof-label">
                          {locale === "ko" ? "결과 해시" : "Result Hash"}
                        </span>
                        <div className="proof-value-row">
                          <code>{shortenValue(run.resultHash)}</code>
                        </div>
                      </div>
                    ) : null}
                    {run.txSignatures.length > 0 ? (
                      <div className="proof-item">
                        <span className="proof-label">
                          {locale === "ko" ? "트랜잭션" : "Transactions"}
                        </span>
                        <div className="proof-links">
                          {run.txSignatures.map((signature, index) => {
                            const href = explorerHref("tx", signature, run.cluster);
                            return href ? (
                              <a
                                key={signature}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proof-link"
                              >
                                {locale === "ko" ? `Tx ${index + 1}` : `Tx ${index + 1}`}
                              </a>
                            ) : (
                              <span key={signature} className="proof-link muted">
                                {locale === "ko" ? `Tx ${index + 1}` : `Tx ${index + 1}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="timeline-list">
                  {run.timeline.slice(0, 4).map((item) => (
                    <div
                      key={`${run.id}-${item.at}-${item.label}`}
                      className="timeline-item"
                    >
                      <p>{new Date(item.at).toLocaleTimeString(localeTime(locale))}</p>
                      <div className="timeline-copy">
                        <span className="timeline-step">
                          {translateTimelineLabel(item.label, locale)}
                        </span>
                        <strong>{translateRuntimeText(item.details, locale)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
