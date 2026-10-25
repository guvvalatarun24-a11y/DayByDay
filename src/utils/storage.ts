import { Skill, StudySession, Assignment, UpcomingSession, AppSettings, ActiveTimerState } from '../types';
import { getTodayDateString, getDaysAgoDateString } from './dateUtils';

const STORAGE_KEYS = {
  SKILLS: 'skillflow_skills_v1',
  SESSIONS: 'skillflow_sessions_v1',
  ASSIGNMENTS: 'skillflow_assignments_v1',
  UPCOMING: 'skillflow_upcoming_v1',
  SETTINGS: 'skillflow_settings_v1',
  TIMER: 'skillflow_active_timer_v1',
  INITIALIZED: 'skillflow_initialized_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  dailyStudyGoalMinutes: 60,
  theme: 'light',
  enableSound: true,
  streakGoal: 14,
};

export function isStorageInitialized(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  } catch {
    return false;
  }
}

export function setStorageInitialized(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } catch {
    // Ignore storage errors in restricted iframe
  }
}

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return defaultValue;
    return parsed as T;
  } catch (err) {
    console.error(`Failed to read from localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write to localStorage key "${key}":`, err);
  }
}

export function loadStoredSkills(): Skill[] {
  const skills = safeGetItem<Skill[]>(STORAGE_KEYS.SKILLS, []);
  if (!Array.isArray(skills)) return [];
  // Validate and sanitize records
  return skills.filter(s => s && typeof s === 'object' && s.id && s.name).map(s => ({
    ...s,
    progress: typeof s.progress === 'number' ? Math.min(100, Math.max(0, s.progress)) : 0,
    dailyStudyGoal: typeof s.dailyStudyGoal === 'number' && s.dailyStudyGoal > 0 ? s.dailyStudyGoal : 45,
    status: s.status === 'Completed' ? 'Completed' : 'In Progress',
    startDate: s.startDate || getTodayDateString(),
  }));
}

export function saveStoredSkills(skills: Skill[]): void {
  safeSetItem(STORAGE_KEYS.SKILLS, skills);
}

export function loadStoredSessions(): StudySession[] {
  const sessions = safeGetItem<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  if (!Array.isArray(sessions)) return [];
  return sessions.filter(s => s && typeof s === 'object' && s.id && s.date);
}

export function saveStoredSessions(sessions: StudySession[]): void {
  safeSetItem(STORAGE_KEYS.SESSIONS, sessions);
}

export function loadStoredAssignments(): Assignment[] {
  const tasks = safeGetItem<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  if (!Array.isArray(tasks)) return [];
  return tasks.filter(t => t && typeof t === 'object' && t.id && t.title && t.dueDate).map(t => ({
    ...t,
    priority: (t.priority === 'High' || t.priority === 'Low') ? t.priority : 'Medium',
    status: t.status === 'Completed' ? 'Completed' : 'Pending',
  }));
}

export function saveStoredAssignments(assignments: Assignment[]): void {
  safeSetItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
}

export const loadStoredTasks = loadStoredAssignments;
export const saveStoredTasks = saveStoredAssignments;

export function loadStoredUpcoming(): UpcomingSession[] {
  const upcoming = safeGetItem<UpcomingSession[]>(STORAGE_KEYS.UPCOMING, []);
  if (!Array.isArray(upcoming)) return [];
  return upcoming.filter(u => u && typeof u === 'object' && u.id && u.date);
}

export function saveStoredUpcoming(upcoming: UpcomingSession[]): void {
  safeSetItem(STORAGE_KEYS.UPCOMING, upcoming);
}

export function loadStoredSettings(): AppSettings {
  const loaded = safeGetItem<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...(loaded || {}),
  };
}

export function saveStoredSettings(settings: AppSettings): void {
  safeSetItem(STORAGE_KEYS.SETTINGS, settings);
}

export function loadStoredTimerState(): ActiveTimerState | null {
  const state = safeGetItem<ActiveTimerState | null>(STORAGE_KEYS.TIMER, null);
  if (!state || typeof state !== 'object' || !state.skillId) return null;
  return state;
}

export function saveStoredTimerState(timerState: ActiveTimerState | null): void {
  if (timerState === null) {
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMER);
    } catch {}
  } else {
    safeSetItem(STORAGE_KEYS.TIMER, timerState);
  }
}

/**
 * Creates rich demo data with active streaks, realistic study sessions,
 * skills in progress and completed, and pending assignments.
 */
export function generateDemoData(): {
  skills: Skill[];
  sessions: StudySession[];
  assignments: Assignment[];
  upcoming: UpcomingSession[];
  settings: AppSettings;
} {
  const today = getTodayDateString();
  const d1 = getDaysAgoDateString(1);
  const d2 = getDaysAgoDateString(2);
  const d3 = getDaysAgoDateString(3);
  const d4 = getDaysAgoDateString(4);
  const d5 = getDaysAgoDateString(5);
  const d6 = getDaysAgoDateString(6);
  const d7 = getDaysAgoDateString(7);
  const d10 = getDaysAgoDateString(10);
  const d14 = getDaysAgoDateString(14);
  const d21 = getDaysAgoDateString(21);
  const d28 = getDaysAgoDateString(28);

  const skills: Skill[] = [
    {
      id: 'skill-python',
      name: 'Python for Data Science',
      description: 'Mastering pandas, NumPy, scikit-learn, and exploratory data analysis pipelines.',
      startDate: d28,
      targetCompletionDate: getDaysAgoDateString(-30),
      dailyStudyGoal: 45,
      progress: 68,
      notes: 'Currently focusing on feature engineering and model evaluation metrics.',
      status: 'In Progress',
      category: 'Programming',
      color: '#8B5CF6',
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'skill-webdev',
      name: 'Modern Web Development',
      description: 'Building full-stack responsive web apps with React, TypeScript, and modern CSS frameworks.',
      startDate: d21,
      targetCompletionDate: getDaysAgoDateString(-20),
      dailyStudyGoal: 60,
      progress: 82,
      notes: 'Completed component architecture and custom hooks. Next: server state synchronization.',
      status: 'In Progress',
      category: 'Web Dev',
      color: '#7C3AED',
      createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'skill-english',
      name: 'Professional English & Public Speaking',
      description: 'Business communication, technical presentation polish, and advanced vocabulary mastery.',
      startDate: d28,
      targetCompletionDate: d7,
      dailyStudyGoal: 30,
      progress: 100,
      notes: 'Completed presentation masterclass and passed executive briefing test.',
      status: 'Completed',
      completedDate: d7,
      category: 'Language',
      color: '#A855F7',
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'skill-dsa',
      name: 'Data Structures & Algorithms',
      description: 'Core patterns: graphs, dynamic programming, trees, and system-level performance.',
      startDate: d14,
      targetCompletionDate: getDaysAgoDateString(-45),
      dailyStudyGoal: 45,
      progress: 42,
      notes: 'Working through two-pointer and sliding window algorithmic questions.',
      status: 'In Progress',
      category: 'Computer Science',
      color: '#6366F1',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sessions: StudySession[] = [
    {
      id: 'sess-1',
      skillId: 'skill-python',
      skillName: 'Python for Data Science',
      date: today,
      durationSeconds: 2700, // 45m
      startTime: '09:00',
      endTime: '09:45',
      notes: 'Worked on data cleaning pipelines with Pandas.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sess-2',
      skillId: 'skill-webdev',
      skillName: 'Modern Web Development',
      date: today,
      durationSeconds: 3600, // 60m
      startTime: '14:30',
      endTime: '15:30',
      notes: 'Implemented state persistence and responsive sidebar drawer.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sess-3',
      skillId: 'skill-dsa',
      skillName: 'Data Structures & Algorithms',
      date: d1,
      durationSeconds: 3000, // 50m
      startTime: '10:00',
      endTime: '10:50',
      notes: 'Solved 2 medium tree traversal problems.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'sess-4',
      skillId: 'skill-webdev',
      skillName: 'Modern Web Development',
      date: d2,
      durationSeconds: 4200, // 70m
      startTime: '11:00',
      endTime: '12:10',
      notes: 'Tailwind grid layouts and accessible modals.',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'sess-5',
      skillId: 'skill-python',
      skillName: 'Python for Data Science',
      date: d3,
      durationSeconds: 3600, // 60m
      startTime: '15:00',
      endTime: '16:00',
      notes: 'Feature normalization and correlation heatmaps.',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'sess-6',
      skillId: 'skill-dsa',
      skillName: 'Data Structures & Algorithms',
      date: d4,
      durationSeconds: 2400, // 40m
      startTime: '16:30',
      endTime: '17:10',
      notes: 'Binary search tree rebalancing principles.',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'sess-7',
      skillId: 'skill-english',
      skillName: 'Professional English & Public Speaking',
      date: d5,
      durationSeconds: 1800, // 30m
      startTime: '08:30',
      endTime: '09:00',
      notes: 'Read technical whitepaper aloud and practiced articulation.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'sess-8',
      skillId: 'skill-python',
      skillName: 'Python for Data Science',
      date: d6,
      durationSeconds: 3600, // 60m
      startTime: '13:00',
      endTime: '14:00',
      notes: 'Model fitting with random forests and evaluation charts.',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'sess-9',
      skillId: 'skill-webdev',
      skillName: 'Modern Web Development',
      date: d7,
      durationSeconds: 5400, // 90m
      startTime: '10:00',
      endTime: '11:30',
      notes: 'Deep dive into React 19 hooks and compiler optimizations.',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
    {
      id: 'sess-10',
      skillId: 'skill-dsa',
      skillName: 'Data Structures & Algorithms',
      date: d10,
      durationSeconds: 2700, // 45m
      startTime: '18:00',
      endTime: '18:45',
      notes: 'Graph cycle detection using BFS/DFS.',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'sess-11',
      skillId: 'skill-english',
      skillName: 'Professional English & Public Speaking',
      date: d14,
      durationSeconds: 2400, // 40m
      startTime: '09:00',
      endTime: '09:40',
      notes: 'Mock technical presentation review session.',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      title: 'Build Exploratory Data Analysis Report',
      description: 'Create a Jupyter notebook showing distributions, correlation matrix, and missing value imputation.',
      skillId: 'skill-python',
      skillName: 'Python for Data Science',
      dueDate: getDaysAgoDateString(-2), // 2 days from now
      priority: 'High',
      status: 'Pending',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'asg-2',
      title: 'Design Dark Mode Contrast Palette',
      description: 'Verify WCAG AA 4.5:1 contrast ratios across all pastel lavender cards and text tokens.',
      skillId: 'skill-webdev',
      skillName: 'Modern Web Development',
      dueDate: getDaysAgoDateString(-1), // tomorrow
      priority: 'Medium',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'asg-3',
      title: 'Solve 5 LeetCode Graph Problems',
      description: 'Focus on Topological Sort, Dijkstra, and connected components.',
      skillId: 'skill-dsa',
      skillName: 'Data Structures & Algorithms',
      dueDate: getDaysAgoDateString(-5), // 5 days from now
      priority: 'High',
      status: 'Pending',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'asg-4',
      title: 'Deliver 10-Minute Slide Deck on Microservices',
      description: 'Final speaking project presented to peer study group with recorded Q&A.',
      skillId: 'skill-english',
      skillName: 'Professional English & Public Speaking',
      dueDate: d7,
      priority: 'Medium',
      status: 'Completed',
      completedAt: d7,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
  ];

  const upcoming: UpcomingSession[] = [
    {
      id: 'up-1',
      title: 'Deep Dive: Logistic Regression & Regularization',
      skillId: 'skill-python',
      skillName: 'Python for Data Science',
      date: getDaysAgoDateString(-1), // Tomorrow
      startTime: '10:00',
      plannedDurationMinutes: 60,
      notes: 'Review L1 and L2 penalty formulas and implement from scratch.',
      status: 'Planned',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'up-2',
      title: 'Dynamic Programming Patterns: 0/1 Knapsack',
      skillId: 'skill-dsa',
      skillName: 'Data Structures & Algorithms',
      date: getDaysAgoDateString(-2), // Day after tomorrow
      startTime: '14:00',
      plannedDurationMinutes: 45,
      notes: 'Tabulation vs memoization comparison.',
      status: 'Planned',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'up-3',
      title: 'React Concurrent Mode & Transitions',
      skillId: 'skill-webdev',
      skillName: 'Modern Web Development',
      date: getDaysAgoDateString(-3),
      startTime: '16:00',
      plannedDurationMinutes: 60,
      notes: 'Test useTransition and useDeferredValue on heavy lists.',
      status: 'Planned',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    skills,
    sessions,
    assignments,
    upcoming,
    settings: DEFAULT_SETTINGS,
  };
}

export function exportAppData(): string {
  const exportPayload = {
    appName: 'DayByDay',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    skills: loadStoredSkills(),
    sessions: loadStoredSessions(),
    tasks: loadStoredAssignments(),
    assignments: loadStoredAssignments(),
    settings: loadStoredSettings(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importAppData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid JSON format: Root element must be an object.' };
    }

    let importedSections = 0;

    if (Array.isArray(data.skills)) {
      saveStoredSkills(data.skills);
      importedSections++;
    }
    if (Array.isArray(data.sessions)) {
      saveStoredSessions(data.sessions);
      importedSections++;
    }
    const tasksArray = Array.isArray(data.tasks) ? data.tasks : Array.isArray(data.assignments) ? data.assignments : null;
    if (tasksArray) {
      saveStoredAssignments(tasksArray);
      importedSections++;
    }
    if (Array.isArray(data.upcoming)) {
      saveStoredUpcoming(data.upcoming);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveStoredSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      importedSections++;
    }

    if (importedSections === 0) {
      return { success: false, message: 'No recognizable DayByDay data (skills, tasks, sessions) found in the file.' };
    }

    setStorageInitialized();
    return { success: true, message: 'Data imported successfully!' };
  } catch (err) {
    return { success: false, message: 'Failed to parse JSON file: ' + (err instanceof Error ? err.message : String(err)) };
  }
}

export function clearAllStoredData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  // Keep initialized flag true so blank slate persists across refresh
  setStorageInitialized();
}
