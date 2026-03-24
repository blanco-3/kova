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
  buildMetrics,
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

async function fetchRuns(): Promise<DemoRun[]> {
  const response = await fetch(`${apiBase}/api/escrows`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load escrows: ${response.status}`);
  }

  return response.json();
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
        setRuns(nextRuns);
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
  const metrics = buildMetrics(runs, locale);
  const trackerRows = buildEscrowRows(runs, locale);
  const recentRuns = runs.slice(0, 3);

  return (
    <>
      {/* Demo Controls Section */}
      <section className="demo-stage">
        <div className="demo-stage-copy">
          <p className="section-label">{copy.demo.sectionLabel}</p>
          <h2>{copy.demo.title}</h2>
          <p>{copy.demo.description}</p>
          <div className="demo-checklist">
            {copy.demo.checklist.map((item, index) => (
              <div key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="control-panel">
          <div className="control-actions">
            <label className="prompt-field">
              <span className="section-label">{copy.demo.prompt}</span>
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
                {busyScenario === "success" ? (
                  <span className="button-loading">{copy.demo.buttons.running}</span>
                ) : (
                  copy.demo.buttons.success
                )}
              </button>
              <button
                className="demo-button danger-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("timeout")}
                type="button"
              >
                {busyScenario === "timeout" ? (
                  <span className="button-loading">{copy.demo.buttons.running}</span>
                ) : (
                  copy.demo.buttons.timeout
                )}
              </button>
              <button
                className="demo-button ghost-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("no_escrow")}
                type="button"
              >
                {busyScenario === "no_escrow" ? (
                  <span className="button-loading">{copy.demo.buttons.running}</span>
                ) : (
                  copy.demo.buttons.noEscrow
                )}
              </button>
            </div>

            <div className="control-grid">
              <div className="control-meta">
                <span>{copy.demo.apiEndpoint}</span>
                <strong>{apiBase}</strong>
              </div>
              <div className="control-meta">
                <span>{copy.demo.totalRuns}</span>
                <strong>{runs.length}</strong>
              </div>
            </div>

            {error && <p className="error-copy">{translateRuntimeText(error, locale)}</p>}
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <SplitView scenarios={scenarioCards} locale={locale} />

      {/* Metrics Section */}
      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.caption}</p>
          </article>
        ))}
      </section>

      {/* Live Tracker */}
      <EscrowTracker escrows={trackerRows} locale={locale} />

      {/* Recent Timeline */}
      {recentRuns.length > 0 && (
        <section className="timeline-grid">
          {recentRuns.map((run) => (
            <article key={run.id} className="timeline-card">
              <div className="scenario-copy">
                <div>
                  <p className="section-label">{translateScenario(run.scenario, locale)}</p>
                  <h2>{translateRoute(run.route, locale)}</h2>
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
                    <span className="timeline-label">
                      {translateTimelineLabel(item.label, locale)}
                    </span>
                    <strong>{translateRuntimeText(item.details, locale)}</strong>
                    <p>{new Date(item.at).toLocaleTimeString(localeTime(locale))}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
