import { StatusBadge } from "./StatusBadge";
import { getUiCopy, type Locale } from "../lib/i18n";

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

export function SplitView({
  scenarios,
  locale,
}: {
  scenarios: Scenario[];
  locale: Locale;
}) {
  const copy = getUiCopy(locale);

  return (
    <section className="comparison-shell">
      <div className="comparison-head">
        <p className="section-label">{copy.comparison.sectionLabel}</p>
        <h2>{copy.comparison.title}</h2>
        <p>{copy.comparison.description}</p>
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
                      {copy.common.step} {index + 1}
                    </span>
                    <StatusBadge status={lane.status} locale={locale} />
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
