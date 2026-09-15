/**
 * Whole days from today until the next occurrence of `birthday`: 0 if it's
 * today, or null if the date is missing/invalid.
 */
export function daysUntilBirthday(
  birthday?: string | Date | null
): number | null {
  if (!birthday) return null;
  const date = new Date(birthday);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (next < todayStart) {
    next = new Date(now.getFullYear() + 1, date.getMonth(), date.getDate());
  }

  // round (not ceil) so DST-shortened/lengthened days don't produce off-by-one
  return Math.round((next.getTime() - todayStart.getTime()) / 86_400_000);
}
