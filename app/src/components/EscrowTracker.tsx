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
          <div>
            <p className="section-label">{copy.tracker.sectionLabel}</p>
            <h2>{copy.tracker.title}</h2>
          </div>
        </div>
        <div style={{ 
          padding: "48px 24px", 
          textAlign: "center", 
          color: "var(--ink-muted)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.85rem"
        }}>
          {copy.tracker.empty}
        </div>
      </section>
    );
  }

  return (
    <section className="tracker-card">
      <div className="tracker-header">
        <div>
          <p className="section-label">{copy.tracker.sectionLabel}</p>
          <h2>{copy.tracker.title}</h2>
        </div>
        <p className="tracker-legend">
          {copy.tracker.legend}
        </p>
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
                <code>{escrow.lifecycle}</code>
              </td>
              <td>{escrow.pair}</td>
              <td>{escrow.amount}</td>
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
