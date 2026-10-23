/** the app's data lives only in this browser, so a backup file is the only copy that survives a lost phone */
export const BACKUP_DAYS = 30;
export const BACKUP_KEY = "titrate.backupAt";
export const BACKUP_SNOOZE = "titrate.backupSnooze";

/** true when a backup nudge is worth showing; a snooze always wins over an old (or missing) backup */
export function backupDue(
  last: number | null,
  now: number,
  snoozedUntil: number | null,
  everyDays = BACKUP_DAYS,
): boolean {
  if (snoozedUntil !== null && snoozedUntil > now) return false;
  if (last === null) return true;
  return (now - last) / 86_400_000 >= everyDays;
}

/** "5 weeks ago", for a line that has no room for a date */
export function backupAge(last: number | null): string {
  if (last === null) return "no backup yet";
  const days = Math.floor((Date.now() - last) / 86_400_000);
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks ago`;
}
