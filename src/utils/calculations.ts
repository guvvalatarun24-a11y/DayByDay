import { Skill, StudySession } from '../types';
import { 
  getTodayDateString, 
  getYesterdayDateString, 
  getCalendarDaysDiff, 
  parseDateString, 
  formatDateToString,
  getDaysAgoDateString
} from './dateUtils';

/**
 * Total Study Time: Sum all saved study-session durations (in seconds).
 */
export function calculateTotalStudyTime(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
}

/**
 * Total Study Time for a specific skill (in seconds).
 */
export function calculateSkillStudyTime(skillId: string, sessions: StudySession[]): number {
  return sessions
    .filter(s => s.skillId === skillId)
    .reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
}

/**
 * Active Learning Days: Count distinct calendar dates with at least one saved study session.
 */
export function calculateActiveLearningDays(sessions: StudySession[]): number {
  const uniqueDates = new Set(sessions.map(s => s.date).filter(Boolean));
  return uniqueDates.size;
}

/**
 * Active Learning Days for a specific skill.
 */
export function calculateSkillActiveDays(skillId: string, sessions: StudySession[]): number {
  const skillDates = new Set(
    sessions
      .filter(s => s.skillId === skillId)
      .map(s => s.date)
      .filter(Boolean)
  );
  return skillDates.size;
}

/**
 * Set of active calendar dates (YYYY-MM-DD).
 */
export function getActiveDateSet(sessions: StudySession[]): Set<string> {
  return new Set(sessions.map(s => s.date).filter(Boolean));
}

/**
 * Current Streak:
 * Count consecutive active dates ending today, or yesterday if today has no activity but yesterday does.
 */
export function calculateCurrentStreak(sessions: StudySession[]): number {
  if (!sessions || sessions.length === 0) return 0;
  
  const activeDates = getActiveDateSet(sessions);
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  let checkDateStr = '';
  if (activeDates.has(today)) {
    checkDateStr = today;
  } else if (activeDates.has(yesterday)) {
    checkDateStr = yesterday;
  } else {
    // Neither today nor yesterday had any session
    return 0;
  }

  let streak = 0;
  const d = parseDateString(checkDateStr);

  while (true) {
    const curDateStr = formatDateToString(d);
    if (activeDates.has(curDateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Longest Streak:
 * Maximum consecutive sequence of active dates in all recorded history.
 */
export function calculateLongestStreak(sessions: StudySession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const dateSet = getActiveDateSet(sessions);
  const sortedDates = Array.from(dateSet).sort(); // YYYY-MM-DD sorts chronologically

  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const diff = getCalendarDaysDiff(prevDate, currDate);

    if (diff === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  return maxStreak;
}

/**
 * Days Since Starting:
 * Calendar-day difference between the skill's start date and today, or its completion date if completed.
 */
export function calculateDaysSinceStarting(skill: Skill): number {
  if (!skill.startDate) return 0;
  const endRef = skill.status === 'Completed' && skill.completedDate 
    ? skill.completedDate 
    : getTodayDateString();

  const diff = getCalendarDaysDiff(skill.startDate, endRef);
  return Math.max(0, diff);
}

/**
 * Overall Progress Percentage:
 * Mean of skill progress values (0 to 100), or 0 if empty.
 */
export function calculateOverallProgress(skills: Skill[]): number {
  if (!skills || skills.length === 0) return 0;
  const sum = skills.reduce((acc, s) => acc + (s.progress || 0), 0);
  return Math.round(sum / skills.length);
}

/**
 * Missed Days:
 * Past dates without recorded activity when a daily study goal was expected.
 * Exclude future dates and dates before the relevant skill's start date.
 */
export function calculateMissedDays(
  skills: Skill[], 
  sessions: StudySession[]
): { count: number; missedDates: string[] } {
  if (!skills || skills.length === 0) {
    return { count: 0, missedDates: [] };
  }

  // Find the earliest start date among all skills
  const validStartDates = skills
    .map(s => s.startDate)
    .filter(Boolean)
    .sort();

  if (validStartDates.length === 0) {
    return { count: 0, missedDates: [] };
  }

  const earliestStartDate = validStartDates[0];
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // If earliest start date is today or in the future, no past days missed yet
  if (earliestStartDate >= today) {
    return { count: 0, missedDates: [] };
  }

  const activeDates = getActiveDateSet(sessions);
  const missedDates: string[] = [];

  const cur = parseDateString(earliestStartDate);
  const yesterdayDate = parseDateString(yesterday);

  // Iterate from earliest start date up to yesterday inclusive
  while (cur <= yesterdayDate) {
    const curStr = formatDateToString(cur);
    if (!activeDates.has(curStr)) {
      missedDates.push(curStr);
    }
    cur.setDate(cur.getDate() + 1);
  }

  return {
    count: missedDates.length,
    missedDates: missedDates.reverse() // Most recent missed days first
  };
}

/**
 * Weekly Study Comparison:
 * Daily study hours/minutes for the current week (Mon-Sun) vs previous week.
 */
export interface DayStudyPoint {
  dayLabel: string; // Mon, Tue, etc.
  dateStr: string;
  durationSeconds: number;
}

export function calculateWeeklyBreakdown(sessions: StudySession[]): {
  thisWeek: DayStudyPoint[];
  lastWeek: DayStudyPoint[];
  thisWeekTotalSeconds: number;
  lastWeekTotalSeconds: number;
} {
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  
  // Find Monday of current week
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - currentDayIndex);

  // Find Monday of last week
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const buildWeekPoints = (monday: Date): DayStudyPoint[] => {
    const points: DayStudyPoint[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateToString(d);
      
      const daySessions = sessions.filter(s => s.date === dateStr);
      const durationSeconds = daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
      
      points.push({
        dayLabel: dayNames[i],
        dateStr,
        durationSeconds
      });
    }
    return points;
  };

  const thisWeek = buildWeekPoints(thisMonday);
  const lastWeek = buildWeekPoints(lastMonday);

  const thisWeekTotalSeconds = thisWeek.reduce((acc, p) => acc + p.durationSeconds, 0);
  const lastWeekTotalSeconds = lastWeek.reduce((acc, p) => acc + p.durationSeconds, 0);

  return {
    thisWeek,
    lastWeek,
    thisWeekTotalSeconds,
    lastWeekTotalSeconds
  };
}

/**
 * Generates an activity heatmap dataset for the last N days (e.g., 90 or 120 days).
 */
export interface HeatmapDay {
  dateStr: string;
  countSeconds: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = 0m, 1 = 1-29m, 2 = 30-59m, 3 = 60-119m, 4 = 120m+
}

export function calculateHeatmap(sessions: StudySession[], daysCount = 84): HeatmapDay[] {
  const dayTotals: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.date) {
      dayTotals[s.date] = (dayTotals[s.date] || 0) + (s.durationSeconds || 0);
    }
  });

  const heatmap: HeatmapDay[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const dateStr = getDaysAgoDateString(i);
    const secs = dayTotals[dateStr] || 0;
    const mins = Math.floor(secs / 60);

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (mins >= 120) level = 4;
    else if (mins >= 60) level = 3;
    else if (mins >= 30) level = 2;
    else if (mins > 0) level = 1;

    heatmap.push({
      dateStr,
      countSeconds: secs,
      level
    });
  }

  return heatmap;
}
