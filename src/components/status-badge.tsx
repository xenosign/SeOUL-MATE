import { STATUS_STYLE } from "@/lib/format";
import type { RequestStatus } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function StatusBadge({ status, t }: { status: RequestStatus; t: Dictionary }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {t.status[status]}
    </span>
  );
}
