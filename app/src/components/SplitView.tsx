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
    <section className="split-grid">
      {scenarios.map((scenario) => (
        <article key={scenario.key} className="split-card">
          <div className="scenario-copy">
            <div>
              <p className="section-label">{scenario.mode}</p>
              <h2>{scenario.headline}</h2>
              <p>{scenario.summary}</p>
            </div>
          </div>
          <div className="lane-list">
            {scenario.lanes.map((lane) => (
              <div key={lane.label} className="lane-item">
                <div className="scenario-copy">
                  <span className="lane-label">{lane.label}</span>
                  <StatusBadge status={lane.status} />
                </div>
                <strong>{lane.title}</strong>
                <p>{lane.note}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
