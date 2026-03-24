type Status =
  | "created"
  | "hash_committed"
  | "completed"
  | "refunded"
  | "disputed"
  | "lost";

const labels: Record<Status, string> = {
  created: "Created",
  hash_committed: "Committed",
  completed: "Completed",
  refunded: "Refunded",
  disputed: "Disputed",
  lost: "Lost",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-pill status-${status}`}>
      {labels[status]}
    </span>
  );
}
