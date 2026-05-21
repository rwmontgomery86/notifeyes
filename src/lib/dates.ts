export function formatShiftWhen(startsAt: Date, endsAt: Date): string {
  const sameDay = startsAt.toDateString() === endsAt.toDateString();
  const dateFmt: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const dateStr = startsAt.toLocaleDateString("en-US", dateFmt);
  const startStr = startsAt.toLocaleTimeString("en-US", timeFmt);
  const endStr = endsAt.toLocaleTimeString("en-US", timeFmt);
  if (sameDay) return `${dateStr} · ${startStr}–${endStr}`;
  const endDateStr = endsAt.toLocaleDateString("en-US", dateFmt);
  return `${dateStr} ${startStr} → ${endDateStr} ${endStr}`;
}

export function relativeTime(date: Date): string {
  const ms = date.getTime() - Date.now();
  const abs = Math.abs(ms);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const dir = ms < 0 ? "ago" : "from now";
  if (minutes < 60) return `${minutes}m ${dir}`;
  if (hours < 48) return `${hours}h ${dir}`;
  return `${days}d ${dir}`;
}
