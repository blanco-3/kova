type Status =
  | "created"
  | "hash_committed"
  | "completed"
  | "refunded"
  | "disputed"
  | "lost";

export function StatusBadge({ status }: { status: Status }) {
  const labels: Record<Status, string> = {
    created: "Created",
    hash_committed: "HashCommitted",
    completed: "Completed",
    refunded: "Refunded",
    disputed: "Disputed",
    lost: "Lost",
  };

  return <span className={`status-pill status-${status}`}>{labels[status]}</span>;
}
