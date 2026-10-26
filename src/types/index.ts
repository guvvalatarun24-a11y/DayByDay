export interface Skill {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  targetCompletionDate?: string; // YYYY-MM-DD
  dailyStudyGoal: number; // in minutes (e.g. 30, 45, 60)
  progress: number; // 0 to 100
  notes: string;
  status: 'In Progress' | 'Completed';
  completedDate?: string; // YYYY-MM-DD when completed
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  skillId: string;
  skillName: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number; // study time in seconds
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string; // HH:mm or HH:mm:ss
  notes?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  skillId?: string; // Optional related skill
  skillName?: string;
  dueDate: string; // YYYY-MM-DD (Deadline date)
  dueTime?: string; // HH:mm (Optional deadline time)
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  completedAt?: string;
  createdAt: string;
}

export type Assignment = Task;

export interface UpcomingSession {
  id: string;
  title: string;
  skillId: string;
  skillName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  plannedDurationMinutes: number; // minutes
  notes?: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface AppSettings {
  dailyStudyGoalMinutes: number;
  theme: 'light' | 'dark';
  enableSound: boolean;
  streakGoal: number;
}

export interface ActiveTimerState {
  skillId: string;
  accumulatedSeconds: number;
  isRunning: boolean;
  lastResumeTimestamp: number | null; // Date.now() when last started/resumed
  sessionStartTime: string; // formatted HH:mm:ss when first clicked start
  sessionNotes: string;
}

export type NavigationPage = 
  | 'dashboard' 
  | 'skills' 
  | 'timer' 
  | 'analytics' 
  | 'todos' 
  | 'upcoming-tasks' 
  | 'assignments' 
  | 'upcoming' 
  | 'settings';
