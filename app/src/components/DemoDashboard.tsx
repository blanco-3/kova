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
      <section className="control-panel">
        <div className="control-copy">
          <p className="section-label">Live demo controls</p>
          <h2>Run the exact three scenarios judges need to see.</h2>
          <p>
            The middleware polls the run registry, drives the on-chain escrow
            flow, and contrasts it with the direct x402 path where funds can be
            lost after payment.
          </p>
        </div>
        <div className="control-actions">
          <label className="prompt-field">
            <span className="section-label">Prompt</span>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
            />
          </label>
          <div className="button-row">
            <button
              className="demo-button"
              disabled={busyScenario !== null}
              onClick={() => void runScenario("success")}
              type="button"
            >
              {busyScenario === "success" ? "Running..." : "Honest Trade"}
            </button>
            <button
              className="demo-button danger-button"
              disabled={busyScenario !== null}
              onClick={() => void runScenario("timeout")}
              type="button"
            >
              {busyScenario === "timeout" ? "Running..." : "Rugpull Defense"}
            </button>
            <button
              className="demo-button ghost-button"
              disabled={busyScenario !== null}
              onClick={() => void runScenario("no_escrow")}
              type="button"
            >
              {busyScenario === "no_escrow" ? "Running..." : "Without Escrow"}
            </button>
          </div>
          <div className="control-meta">
            <span>API</span>
            <strong>{apiBase}</strong>
          </div>
          {error ? <p className="error-copy">{error}</p> : null}
        </div>
      </section>

      <SplitView scenarios={scenarioCards} />

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.caption}</p>
          </article>
        ))}
      </section>

      <EscrowTracker escrows={trackerRows} />

      <section className="timeline-grid">
        {recentRuns.map((run) => (
          <article key={run.id} className="timeline-card">
            <div className="scenario-copy">
              <div>
                <p className="section-label">{run.scenario}</p>
                <h2>{run.route}</h2>
              </div>
              <span className={`status-pill status-${run.status}`}>{run.status}</span>
            </div>
            <p>{run.reason}</p>
            <div className="timeline-list">
              {run.timeline.map((item) => (
                <div key={`${run.id}-${item.at}-${item.label}`} className="timeline-item">
                  <span className="timeline-label">{item.label}</span>
                  <strong>{item.details}</strong>
                  <p>{new Date(item.at).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
