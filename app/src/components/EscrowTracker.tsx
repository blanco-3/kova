import { StatusBadge } from "./StatusBadge";

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

export function EscrowTracker({ escrows }: { escrows: EscrowRow[] }) {
  if (escrows.length === 0) {
    return (
      <section className="tracker-card">
        <div className="tracker-header">
          <div>
            <p className="section-label">Live Board</p>
            <h2>Escrow Lifecycle Tracker</h2>
          </div>
        </div>
        <div style={{ 
          padding: "48px 24px", 
          textAlign: "center", 
          color: "var(--ink-muted)",
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.85rem"
        }}>
          No escrows recorded yet. Run a scenario to see the lifecycle.
        </div>
      </section>
    );
  }

  return (
    <section className="tracker-card">
      <div className="tracker-header">
        <div>
          <p className="section-label">Live Board</p>
          <h2>Escrow Lifecycle Tracker</h2>
        </div>
        <p className="tracker-legend">
          Created &rarr; HashCommitted &rarr; Completed / Refunded / Disputed
        </p>
      </div>
      <table className="tracker-table">
        <thead>
          <tr>
            <th>Escrow</th>
            <th>Route</th>
            <th>Amount</th>
            <th>Hash</th>
            <th>Status</th>
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
                <StatusBadge status={escrow.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
