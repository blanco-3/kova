import { type Locale, translateStatus } from "../lib/i18n";

type Status =
  | "created"
  | "hash_committed"
  | "completed"
  | "refunded"
  | "disputed"
  | "lost";

export function StatusBadge({
  status,
  locale = "en",
}: {
  status: Status;
  locale?: Locale;
}) {
  return (
    <span className={`status-pill status-${status}`}>
      {translateStatus(status, locale)}
    </span>
  );
}
