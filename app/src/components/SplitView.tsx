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
        <h2>
          {locale === "ko" ? (
            <>
              같은 요청. <span className="accent">완전히 다른 결과.</span>
            </>
          ) : (
            <>
              Same request. <span className="accent">Two outcomes.</span>
            </>
          )}
        </h2>
        <p>
          {locale === "ko"
            ? "에스크로 레이어가 결제를 전달 검증 후에만 릴리즈하는 암호학적 보장을 만듭니다."
            : "The escrow layer creates a cryptographic guarantee that payment only flows after delivery is verified."}
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
                <h2>{scenario.mode}</h2>
              </div>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  background:
                    scenario.key === "without"
                      ? "var(--red-dim)"
                      : "var(--emerald-dim)",
                  color:
                    scenario.key === "without" ? "var(--red)" : "var(--emerald)",
                  flexShrink: 0,
                }}
              >
                {scenario.key === "without" ? "✗" : "✓"}
              </span>
            </div>

            <div className="lane-list">
              {scenario.lanes.map((lane, index) => (
                <div key={lane.label} className="lane-item">
                  <strong>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        background:
                          scenario.key === "without"
                            ? "var(--red-dim)"
                            : "var(--teal-dim)",
                        color:
                          scenario.key === "without" ? "var(--red)" : "var(--teal)",
                        flexShrink: 0,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {index + 1}
                    </span>
                    {lane.title}
                    <StatusBadge status={lane.status} locale={locale} />
                  </strong>
                  <p style={{ paddingLeft: 36 }}>{lane.note}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
