"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
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
  translateRoute,
} from "../lib/i18n";

const apiBase =
  process.env.NEXT_PUBLIC_DEMO_API_BASE ?? "http://127.0.0.1:8787";
const localRunsKey = "x402-escrow-demo-runs";

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

export function DemoDashboard({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const [runs, setRuns] = useState<DemoRun[]>([]);
  const [prompt, setPrompt] = useState(getDefaultPrompt(locale));
  const [busyScenario, setBusyScenario] = useState<DemoScenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousLocale = useRef(locale);

  const refreshRuns = useEffectEvent(async () => {
    try {
      const nextRuns = await fetchRuns();
      startTransition(() => {
        setRuns((current) => mergeRuns(current, nextRuns));
        setError(null);
      });
    } catch (refreshError) {
      startTransition(() => {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to refresh demo runs"
        );
      });
    }
  });

  useEffect(() => {
    startTransition(() => {
      setRuns(readCachedRuns());
    });
    void refreshRuns();
    const intervalId = setInterval(() => {
      void refreshRuns();
    }, 2_000);
    return () => clearInterval(intervalId);
  }, [refreshRuns]);

  useEffect(() => {
    const previousDefault = getDefaultPrompt(previousLocale.current);
    if (prompt === previousDefault || prompt === getDefaultPrompt(locale)) {
      setPrompt(getDefaultPrompt(locale));
    }
    previousLocale.current = locale;
  }, [locale, prompt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(localRunsKey, JSON.stringify(runs.slice(0, 12)));
  }, [runs]);

  async function runScenario(scenario: DemoScenario) {
    setBusyScenario(scenario);
    setError(null);
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
      setError(
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
        <div className="demo-stage-copy">
          <p className="section-label">{copy.demo.sectionLabel}</p>
          <h2>
            {locale === "ko" ? (
              <>
                세 가지 시나리오. <span className="accent">하나의 질문.</span>
              </>
            ) : (
              <>
                Three scenarios. <span className="accent">One question.</span>
              </>
            )}
          </h2>
          <p>
            {locale === "ko"
              ? "전달이 실패했을 때 결제는 어떻게 되는가?"
              : "What happens to the payment when delivery goes wrong?"}
          </p>
        </div>

        <div className="control-panel">
          <div className="control-actions">
            <label className="prompt-field">
              <span className="section-label">
                {locale === "ko" ? "태스크 프롬프트" : "TASK PROMPT"}
              </span>
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                placeholder={copy.demo.promptPlaceholder}
              />
            </label>

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

            <div className="control-grid">
              <div className="control-meta">
                <span>{copy.demo.apiEndpoint}</span>
                <strong>{apiBase}</strong>
              </div>
              <div className="control-meta">
                <span>{locale === "ko" ? "총 실행 수" : "TOTAL EXECUTIONS"}</span>
                <strong>{runs.length}</strong>
              </div>
            </div>

            {error && <p className="error-copy">{translateRuntimeText(error, locale)}</p>}
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
                      {translateScenario(run.scenario, locale) === "success"
                        ? "Honest Trade"
                        : translateScenario(run.scenario, locale) === "timeout"
                          ? "Rugpull Defense"
                          : translateScenario(run.scenario, locale) === "no escrow"
                            ? "Without Escrow"
                            : translateScenario(run.scenario, locale)}
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
                <div className="timeline-list">
                  {run.timeline.slice(0, 4).map((item) => (
                    <div
                      key={`${run.id}-${item.at}-${item.label}`}
                      className="timeline-item"
                    >
                      <p>{new Date(item.at).toLocaleTimeString(localeTime(locale))}</p>
                      <strong>{translateRuntimeText(item.details, locale)}</strong>
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
