"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
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

export function DemoInterface() {
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
      {/* Control Panel */}
      <div className="control-panel">
        <label>
          <span className="control-label">Test Prompt</span>
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

        <div className="control-meta-row">
          <span className="control-meta">
            Endpoint: <strong>{apiBase}</strong>
          </span>
          <span className="control-meta">
            Total Runs: <strong>{runs.length}</strong>
          </span>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>

      {/* Comparison Cards */}
      <section className="comparison-section">
        <div className="comparison-grid">
          <article className="comparison-card risk-card">
            <span className="card-label">Without Escrow</span>
            <h3>{scenarioCards.without.title}</h3>
            <p>{scenarioCards.without.description}</p>
            <div className="steps-list">
              {scenarioCards.without.steps.map((step, i) => (
                <div key={step} className="step-item">
                  <span className="step-number">{i + 1}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="comparison-card safe-card">
            <span className="card-label">With x402 Escrow</span>
            <h3>{scenarioCards.with.title}</h3>
            <p>{scenarioCards.with.description}</p>
            <div className="steps-list">
              {scenarioCards.with.steps.map((step, i) => (
                <div key={step} className="step-item">
                  <span className="step-number">{i + 1}</span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* Metrics */}
      <section className="metrics-section">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span className="metric-label">{metric.label}</span>
            <div className="metric-value">{metric.value}</div>
            <span className="metric-caption">{metric.caption}</span>
          </article>
        ))}
      </section>

      {/* Tracker Table */}
      {trackerRows.length > 0 && (
        <section className="tracker-section">
          <div className="tracker-header">
            <h2 className="tracker-title">Recent Escrows</h2>
            <span className="tracker-count">{trackerRows.length} total</span>
          </div>
          <table className="tracker-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Scenario</th>
                <th>Status</th>
                <th>Amount</th>
                <th>PDA</th>
              </tr>
            </thead>
            <tbody>
              {trackerRows.slice(0, 8).map((row) => (
                <tr key={row.id}>
                  <td>{row.route}</td>
                  <td>{row.scenario.replace("_", " ")}</td>
                  <td>
                    <span className={`status-pill status-${row.status}`}>
                      {row.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{row.amount}</td>
                  <td>
                    <code>{row.escrowPda || "—"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Recent Timeline */}
      {recentRuns.length > 0 && (
        <section className="timeline-section">
          {recentRuns.map((run) => (
            <article key={run.id} className="timeline-card">
              <div className="timeline-card-header">
                <div>
                  <span className="timeline-scenario">
                    {run.scenario.replace("_", " ")}
                  </span>
                  <h3 className="timeline-route">{run.route}</h3>
                </div>
                <span className={`status-pill status-${run.status}`}>
                  {run.status.replace("_", " ")}
                </span>
              </div>
              <p className="timeline-reason">{run.reason}</p>
              <div className="timeline-list">
                {run.timeline.slice(0, 4).map((item) => (
                  <div
                    key={`${run.id}-${item.at}-${item.label}`}
                    className="timeline-item"
                  >
                    <span className="timeline-item-label">{item.label}</span>
                    <div className="timeline-item-detail">{item.details}</div>
                    <span className="timeline-item-time">
                      {new Date(item.at).toLocaleTimeString()}
                    </span>
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
