const relativeTimeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export function formatRelativeTime(date: Date | string) {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMinutes = Math.round((target.getTime() - Date.now()) / 60_000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) return relativeTimeFormatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return relativeTimeFormatter.format(diffDays, "day");

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return relativeTimeFormatter.format(diffMonths, "month");

  const diffYears = Math.round(diffMonths / 12);
  return relativeTimeFormatter.format(diffYears, "year");
}

export function formatDateTime(date: Date | string) {
  return dateTimeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatDate(date: Date | string) {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function toDateTimeLocalValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const target = typeof date === "string" ? new Date(date) : date;
  const offsetMs = target.getTimezoneOffset() * 60_000;
  return new Date(target.getTime() - offsetMs).toISOString().slice(0, 16);
}
