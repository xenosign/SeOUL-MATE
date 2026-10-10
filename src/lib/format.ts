export function formatDate(date: string) {
  return new Date(date + (date.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export const STATUS_LABEL = {
  open: "Looking for a guide",
  matched: "Matched",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export const STATUS_STYLE = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  matched: "bg-sky-50 text-sky-700 ring-sky-600/20",
  completed: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
} as const;
