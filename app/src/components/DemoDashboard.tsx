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
  DEFAULT_PROMPT,
  buildEscrowRows,
  buildMetrics,
  buildScenarioCards,
  type DemoRun,
  type DemoScenario,
} from "../lib/escrow";

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

export function DemoDashboard() {
  const [runs, setRuns] = useState<DemoRun[]>([]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [busyScenario, setBusyScenario] = useState<DemoScenario | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const scenarioCards = buildScenarioCards(runs);
  const metrics = buildMetrics(runs);
  const trackerRows = buildEscrowRows(runs);
  const recentRuns = runs.slice(0, 3);

  return (
    <>
      {/* Demo Controls Section */}
      <section className="demo-stage">
        <div className="demo-stage-copy">
          <p className="section-label">Live Demo Controls</p>
          <h2>Three scenarios. One question answered.</h2>
          <p>
            Does x402 settle before delivery, or only after delivery is proven?
            Run each flow and watch the difference in real-time.
          </p>
          <div className="demo-checklist">
            <div>
              <span>1</span>
              <p>Start with direct payment baseline</p>
            </div>
            <div>
              <span>2</span>
              <p>Run the escrowed honest trade</p>
            </div>
            <div>
              <span>3</span>
              <p>Trigger the rugpull defense</p>
            </div>
          </div>
        </div>

        <div className="control-panel">
          <div className="control-actions">
            <label className="prompt-field">
              <span className="section-label">Prompt</span>
              <textarea
                className="prompt-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                placeholder="Enter a test prompt for the demo..."
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
                  <span className="button-loading">Running...</span>
                ) : (
                  "Honest Trade"
                )}
              </button>
              <button
                className="demo-button danger-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("timeout")}
                type="button"
              >
                {busyScenario === "timeout" ? (
                  <span className="button-loading">Running...</span>
                ) : (
                  "Rugpull Defense"
                )}
              </button>
              <button
                className="demo-button ghost-button"
                disabled={busyScenario !== null}
                onClick={() => void runScenario("no_escrow")}
                type="button"
              >
                {busyScenario === "no_escrow" ? (
                  <span className="button-loading">Running...</span>
                ) : (
                  "Without Escrow"
                )}
              </button>
            </div>

            <div className="control-grid">
              <div className="control-meta">
                <span>API Endpoint</span>
                <strong>{apiBase}</strong>
              </div>
              <div className="control-meta">
                <span>Total Runs</span>
                <strong>{runs.length}</strong>
              </div>
            </div>

            {error && <p className="error-copy">{error}</p>}
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <SplitView scenarios={scenarioCards} />

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
      <EscrowTracker escrows={trackerRows} />

      {/* Recent Timeline */}
      {recentRuns.length > 0 && (
        <section className="timeline-grid">
          {recentRuns.map((run) => (
            <article key={run.id} className="timeline-card">
              <div className="scenario-copy">
                <div>
                  <p className="section-label">{run.scenario.replace("_", " ")}</p>
                  <h2>{run.route}</h2>
                </div>
                <span className={`status-pill status-${run.status}`}>
                  {run.status.replace("_", " ")}
                </span>
              </div>
              <p>{run.reason}</p>
              <div className="timeline-list">
                {run.timeline.slice(0, 4).map((item) => (
                  <div
                    key={`${run.id}-${item.at}-${item.label}`}
                    className="timeline-item"
                  >
                    <span className="timeline-label">{item.label}</span>
                    <strong>{item.details}</strong>
                    <p>{new Date(item.at).toLocaleTimeString()}</p>
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
