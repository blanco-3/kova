import { StatusBadge } from "./StatusBadge";

interface ScenarioLane {
  label: string;
  title: string;
  note: string;
  status:
    | "created"
    | "hash_committed"
    | "completed"
    | "refunded"
    | "disputed"
    | "lost";
}

export interface Scenario {
  key: string;
  mode: string;
  headline: string;
  summary: string;
  lanes: ScenarioLane[];
}

export function SplitView({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <section className="comparison-shell">
      <div className="comparison-head">
        <p className="section-label">Before / After</p>
        <h2>Same request. Two settlement outcomes.</h2>
        <p>
          The left lane shows why direct x402 is fragile. The right lane shows
          the escrowed path that converts failure into an explicit refund.
        </p>
      </div>

      <div className="split-grid">
        {scenarios.map((scenario) => (
          <article
            key={scenario.key}
            className={`split-card split-${scenario.key}`}
          >
            <div className="scenario-copy">
              <div>
                <p className="section-label">{scenario.mode}</p>
                <h2>{scenario.headline}</h2>
                <p>{scenario.summary}</p>
              </div>
            </div>

            <div className="lane-list">
              {scenario.lanes.map((lane, index) => (
                <div key={lane.label} className="lane-item">
                  <div className="scenario-copy">
                    <span className="lane-label">
                      Step {index + 1}
                    </span>
                    <StatusBadge status={lane.status} />
                  </div>
                  <strong>{lane.title}</strong>
                  <p>{lane.note}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
