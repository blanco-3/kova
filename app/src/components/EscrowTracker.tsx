import { StatusBadge } from "./StatusBadge";
import { getUiCopy, type Locale } from "../lib/i18n";

export interface EscrowRow {
  id: string;
  pair: string;
  amount: string;
  lifecycle: string;
  hash: string;
  status:
    | "created"
    | "hash_committed"
    | "completed"
    | "refunded"
    | "disputed"
    | "lost";
}

export function EscrowTracker({
  escrows,
  locale,
}: {
  escrows: EscrowRow[];
  locale: Locale;
}) {
  const copy = getUiCopy(locale);

  if (escrows.length === 0) {
    return (
      <section className="tracker-card">
        <div className="tracker-header">
          <p className="section-label">{copy.tracker.sectionLabel}</p>
          <h2>{copy.tracker.title}</h2>
        </div>
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--ink-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            border: "1px solid var(--glass-border)",
            borderRadius: "16px",
          }}
        >
          {copy.tracker.empty}
        </div>
      </section>
    );
  }

  return (
    <section className="tracker-card">
      <div className="tracker-header">
        <p className="section-label">{copy.tracker.sectionLabel}</p>
        <h2>{copy.tracker.title}</h2>
      </div>
      <table className="tracker-table">
        <thead>
          <tr>
            {copy.tracker.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {escrows.map((escrow) => (
            <tr key={escrow.id}>
              <td>
                <strong>{escrow.id}</strong>
              </td>
              <td
                style={{ color: "var(--ink-secondary)", fontSize: "0.9rem" }}
              >
                {escrow.pair}
              </td>
              <td style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                {escrow.amount}
              </td>
              <td>
                <code>{escrow.hash}</code>
              </td>
              <td>
                <StatusBadge status={escrow.status} locale={locale} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
