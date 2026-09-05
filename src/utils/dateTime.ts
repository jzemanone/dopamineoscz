// DateTime Utilities for Dopamine OS - Time-Precision Open Loops & Reminders

/**
 * Combines date (YYYY-MM-DD) and optional time (HH:mm) into a full ISO string (YYYY-MM-DDTHH:mm).
 * Defaults time to 09:00 AM if no time is provided.
 */
export function normalizeDueDateTime(dateStr?: string, timeStr?: string): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;

  const trimmedDate = dateStr.trim();

  // If already contains time component
  if (trimmedDate.includes('T')) {
    const [d, t] = trimmedDate.split('T');
    const finalTime = timeStr?.trim() || t || '09:00';
    return `${d}T${finalTime.slice(0, 5)}`;
  }

  const finalTime = timeStr && timeStr.trim() ? timeStr.trim().slice(0, 5) : '09:00';
  return `${trimmedDate}T${finalTime}`;
}

/**
 * Safely parses an ISO date-time string (or legacy date-only string) into a Date object.
 */
export function parseDueDateTime(dueDateTimeStr?: string): Date | null {
  if (!dueDateTimeStr || !dueDateTimeStr.trim()) return null;

  const normalized = normalizeDueDateTime(dueDateTimeStr);
  if (!normalized) return null;

  const [datePart, timePart] = normalized.split('T');
  if (!datePart) return null;

  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hourStr, minStr] = (timePart || '09:00').split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hours = parseInt(hourStr || '9', 10);
  const minutes = parseInt(minStr || '0', 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const parsed = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a Date object or ISO string into friendly US English formats.
 */
export function formatDueDateTime(dueDateTimeStr?: string): {
  formattedDate: string;
  formattedTime: string;
  isDefaultTime: boolean;
  label: string;
  fullDateTimeString: string;
} | null {
  const dateObj = parseDueDateTime(dueDateTimeStr);
  if (!dateObj) return null;

  const now = new Date();
  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    dateObj.getFullYear() === tomorrow.getFullYear() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getDate() === tomorrow.getDate();

  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const isDefaultTime = hours === 9 && minutes === 0;

  // Format Date (e.g. "18. srp 2026" or "Dnes" / "Zítra")
  const monthNames = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
  const monthStr = monthNames[dateObj.getMonth()];
  const dayNum = dateObj.getDate();
  const yearNum = dateObj.getFullYear();

  const exactDateStr = `${dayNum}. ${monthStr} ${yearNum}`;
  const relativeDateStr = isToday ? 'Dnes' : isTomorrow ? 'Zítra' : exactDateStr;

  // Format Time (e.g. "9:00", "14:30")
  const displayMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedTime = `${hours}:${displayMinutes}`;

  const label = `${relativeDateStr} v ${formattedTime}`;
  const fullDateTimeString = `${exactDateStr} v ${formattedTime}`;

  return {
    formattedDate: relativeDateStr,
    formattedTime,
    isDefaultTime,
    label,
    fullDateTimeString,
  };
}

/**
 * Returns user helper text for Open Loop creation form
 */
export function getReminderHelperText(dateVal?: string, timeVal?: string): string {
  if (!dateVal || !dateVal.trim()) {
    return 'Volná smyčka bez termínu — pasivně čeká na ranní plánování.';
  }

  const normalized = normalizeDueDateTime(dateVal, timeVal);
  const parsed = formatDueDateTime(normalized);
  if (!parsed) {
    return 'Upozornění bude nastaveno na vybrané datum.';
  }

  if (timeVal && timeVal.trim()) {
    return `Upozornění nastaveno na ${parsed.fullDateTimeString}.`;
  }

  return `Upozornění nastaveno na ${parsed.formattedDate} v 9:00 (výchozí).`;
}

/**
 * Checks if a loop is due for time-precision notification right now
 */
export function isDueForNotification(dueDateTimeStr?: string, currentTimeMs: number = Date.now()): boolean {
  const dateObj = parseDueDateTime(dueDateTimeStr);
  if (!dateObj) return false;
  return currentTimeMs >= dateObj.getTime();
}

/**
 * Postpones an ISO due date-time by +1 day, preserving the exact hour and minute
 */
export function postponeDueDateByOneDay(dueDateTimeStr?: string): string {
  const dateObj = parseDueDateTime(dueDateTimeStr) || new Date();
  dateObj.setDate(dateObj.getDate() + 1);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
