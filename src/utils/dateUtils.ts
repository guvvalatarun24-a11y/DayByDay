/**
 * Date and time utilities designed to avoid timezone offset pitfalls.
 * All calendar dates are represented as YYYY-MM-DD.
 */

export function getTodayDateString(): string {
  const now = new Date();
  return formatDateToString(now);
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToString(d);
}

export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function formatReadableDate(dateStr: string, options?: { includeYear?: boolean; shortMonth?: boolean }): string {
  if (!dateStr) return '';
  const d = parseDateString(dateStr);
  const monthNames = options?.shortMonth 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const month = monthNames[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  
  if (options?.includeYear !== false) {
    return `${month} ${day}, ${year}`;
  }
  return `${month} ${day}`;
}

export function formatCurrentTime(includeSeconds = false): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

/**
 * Calculates calendar-day difference between two YYYY-MM-DD strings (date2 - date1).
 * Safe from Daylight Savings Time shifts by rounding midnight timestamps.
 */
export function getCalendarDaysDiff(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const d1 = parseDateString(startDateStr);
  const d2 = parseDateString(endDateStr);
  
  // Set both to local midnight
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Converts seconds into a formatted string (e.g., "2h 45m" or "35m" or "0m").
 */
export function formatDurationHuman(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Converts seconds into HH:MM:SS format for the timer display.
 */
export function formatTimerDigital(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  return `${hh}:${mm}:${ss}`;
}

/**
 * Get date string N days before given date
 */
export function getDaysAgoDateString(daysAgo: number, fromDateStr?: string): string {
  const base = fromDateStr ? parseDateString(fromDateStr) : new Date();
  base.setDate(base.getDate() - daysAgo);
  return formatDateToString(base);
}

/**
 * Checks if a date is today, yesterday, or overdue
 */
export function getDateRelativeLabel(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  
  const tomorrow = getDaysAgoDateString(-1);
  if (dateStr === tomorrow) return 'Tomorrow';
  
  return formatReadableDate(dateStr, { shortMonth: true });
}

export function isDateOverdue(dateStr: string): boolean {
  const today = getTodayDateString();
  return dateStr < today;
}

/**
 * Checks if a task is overdue based on local date and optional time.
 * If status is Completed, never overdue.
 * If due date is today and no time specified, it's due at end of day (not overdue).
 * If due date is in the future, never overdue.
 */
export function isTaskOverdue(dueDate: string, dueTime?: string, status?: string): boolean {
  if (status === 'Completed' || !dueDate) return false;
  const todayStr = getTodayDateString();

  if (dueDate > todayStr) return false;
  if (dueDate < todayStr) return true;

  // Due today: check optional time
  if (!dueTime) {
    return false;
  }

  const [hours, minutes] = dueTime.split(':').map(n => parseInt(n, 10));
  const now = new Date();
  const deadlineDateTime = new Date();
  deadlineDateTime.setHours(isNaN(hours) ? 23 : hours, isNaN(minutes) ? 59 : minutes, 59, 999);

  return now > deadlineDateTime;
}

/**
 * Generates user-friendly deadline label (e.g. "Due Today", "Due tomorrow", "Due in 5 days", "Overdue")
 */
export function getTaskDeadlineInfo(dueDate: string, dueTime?: string, status?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  formattedTime?: string;
} {
  const isOverdue = isTaskOverdue(dueDate, dueTime, status);
  const todayStr = getTodayDateString();
  const tomorrowStr = getDaysAgoDateString(-1);
  const diffDays = getCalendarDaysDiff(todayStr, dueDate);

  const timeSuffix = dueTime ? ` at ${dueTime}` : '';
  let label = '';

  if (status === 'Completed') {
    label = `Completed · Was due ${formatReadableDate(dueDate, { shortMonth: true })}`;
  } else if (isOverdue) {
    if (diffDays === 0) {
      label = `Overdue (Past ${dueTime})`;
    } else if (diffDays === -1) {
      label = `Overdue (Yesterday${timeSuffix})`;
    } else {
      label = `Overdue by ${Math.abs(diffDays)} days`;
    }
  } else if (dueDate === todayStr) {
    label = `Due Today${timeSuffix}`;
  } else if (dueDate === tomorrowStr) {
    label = `Due tomorrow${timeSuffix}`;
  } else if (diffDays > 1 && diffDays <= 7) {
    label = `Due in ${diffDays} days${timeSuffix}`;
  } else {
    label = `Due ${formatReadableDate(dueDate, { shortMonth: true })}${timeSuffix}`;
  }

  return {
    label,
    isOverdue,
    isToday: dueDate === todayStr,
    isTomorrow: dueDate === tomorrowStr,
    formattedTime: dueTime,
  };
}
