import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Skill, 
  StudySession, 
  Assignment, 
  UpcomingSession, 
  AppSettings, 
  ActiveTimerState, 
  NavigationPage 
} from '../types';
import { 
  loadStoredSkills, 
  saveStoredSkills, 
  loadStoredSessions, 
  saveStoredSessions, 
  loadStoredAssignments, 
  saveStoredAssignments, 
  loadStoredUpcoming, 
  saveStoredUpcoming, 
  loadStoredSettings, 
  saveStoredSettings, 
  loadStoredTimerState, 
  saveStoredTimerState, 
  generateDemoData, 
  clearAllStoredData, 
  importAppData,
  isStorageInitialized,
  setStorageInitialized,
  DEFAULT_SETTINGS 
} from '../utils/storage';
import { getTodayDateString } from '../utils/dateUtils';

interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  skills: Skill[];
  sessions: StudySession[];
  tasks: Assignment[];
  assignments: Assignment[]; // backward compatibility alias
  upcomingSessions: UpcomingSession[];
  settings: AppSettings;
  activeTimerState: ActiveTimerState | null;
  currentView: NavigationPage;
  preselectedSkillId: string | null;
  notification: NotificationToast | null;
  
  // Navigation & Actions
  setCurrentView: (view: NavigationPage) => void;
  startStudyingSkill: (skillId: string) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
  dismissNotification: () => void;

  // Skills
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  completeSkill: (id: string) => void;
  reopenSkill: (id: string) => void;

  // Study Sessions
  addSession: (session: Omit<StudySession, 'id' | 'createdAt'>) => void;
  deleteSession: (id: string) => void;

  // Tasks & To-Do List
  addTask: (task: Omit<Assignment, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Assignment>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleAssignment: (id: string) => void;

  // Upcoming Sessions
  addUpcomingSession: (session: Omit<UpcomingSession, 'id' | 'createdAt'>) => void;
  updateUpcomingSession: (id: string, updates: Partial<UpcomingSession>) => void;
  deleteUpcomingSession: (id: string) => void;

  // Settings & Timer
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateActiveTimerState: (state: ActiveTimerState | null) => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  clearAllData: () => void;
  importJsonData: (json: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // First time bootstrap: only runs if storage has never been initialized
  if (typeof window !== 'undefined' && !isStorageInitialized()) {
    const demo = generateDemoData();
    saveStoredSkills(demo.skills);
    saveStoredSessions(demo.sessions);
    saveStoredAssignments(demo.assignments);
    saveStoredUpcoming(demo.upcoming);
    saveStoredSettings(demo.settings);
    setStorageInitialized();
  }

  const [skills, setSkills] = useState<Skill[]>(() => loadStoredSkills());
  const [sessions, setSessions] = useState<StudySession[]>(() => loadStoredSessions());
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadStoredAssignments());
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(() => loadStoredUpcoming());
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const [activeTimerState, setActiveTimerState] = useState<ActiveTimerState | null>(() => loadStoredTimerState());
  const [currentView, setCurrentView] = useState<NavigationPage>('dashboard');
  const [preselectedSkillId, setPreselectedSkillId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationToast | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStoredSkills(skills);
  }, [skills]);

  useEffect(() => {
    saveStoredSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveStoredAssignments(assignments);
  }, [assignments]);

  useEffect(() => {
    saveStoredUpcoming(upcomingSessions);
  }, [upcomingSessions]);

  useEffect(() => {
    saveStoredSettings(settings);
    // Apply theme class to document element
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    saveStoredTimerState(activeTimerState);
  }, [activeTimerState]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setNotification({ id, message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const startStudyingSkill = useCallback((skillId: string) => {
    setPreselectedSkillId(skillId);
    setCurrentView('timer');
  }, []);

  // Skill mutations
  const addSkill = useCallback((skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = new Date().toISOString();
    const newSkill: Skill = {
      ...skillData,
      id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setSkills(prev => [newSkill, ...prev]);
    showNotification(`Added skill: "${newSkill.name}"`, 'success');
  }, [showNotification]);

  const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
    setSkills(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));
    showNotification('Skill updated successfully', 'info');
  }, [showNotification]);

  const deleteSkill = useCallback((id: string) => {
    const target = skills.find(s => s.id === id);
    setSkills(prev => prev.filter(s => s.id !== id));
    showNotification(`Deleted "${target?.name || 'skill'}"`, 'info');
  }, [skills, showNotification]);

  const completeSkill = useCallback((id: string) => {
    const today = getTodayDateString();
    setSkills(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'Completed',
          progress: 100,
          completedDate: today,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }

    const s = skills.find(x => x.id === id);
    showNotification(`Congratulations! You completed "${s?.name || 'Skill'}"! 🎉`, 'success');
  }, [skills, showNotification]);

  const reopenSkill = useCallback((id: string) => {
    setSkills(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: 'In Progress',
          completedDate: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));
    showNotification('Skill reopened to In Progress', 'info');
  }, [showNotification]);

  // Session mutations
  const addSession = useCallback((sessionData: Omit<StudySession, 'id' | 'createdAt'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    showNotification(`Recorded ${Math.round(sessionData.durationSeconds / 60)}m study session!`, 'success');
  }, [showNotification]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showNotification('Study session removed', 'info');
  }, [showNotification]);

  // Assignment mutations
  const addAssignment = useCallback((asgData: Omit<Assignment, 'id' | 'createdAt'>) => {
    const newAsg: Assignment = {
      ...asgData,
      id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setAssignments(prev => [newAsg, ...prev]);
    showNotification(`Added assignment: "${newAsg.title}"`, 'success');
  }, [showNotification]);

  const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    showNotification('Assignment updated', 'info');
  }, [showNotification]);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    showNotification('Assignment deleted', 'info');
  }, [showNotification]);

  const toggleAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'Completed' ? 'Pending' : 'Completed';
        const completedAt = nextStatus === 'Completed' ? getTodayDateString() : undefined;
        return { ...a, status: nextStatus, completedAt };
      }
      return a;
    }));
  }, []);

  // Upcoming mutations
  const addUpcomingSession = useCallback((upData: Omit<UpcomingSession, 'id' | 'createdAt'>) => {
    const newUpcoming: UpcomingSession = {
      ...upData,
      id: `upcoming-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setUpcomingSessions(prev => [...prev, newUpcoming]);
    showNotification('Study session scheduled!', 'success');
  }, [showNotification]);

  const updateUpcomingSession = useCallback((id: string, updates: Partial<UpcomingSession>) => {
    setUpcomingSessions(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    showNotification('Session schedule updated', 'info');
  }, [showNotification]);

  const deleteUpcomingSession = useCallback((id: string) => {
    setUpcomingSessions(prev => prev.filter(u => u.id !== id));
    showNotification('Scheduled session removed', 'info');
  }, [showNotification]);

  // Settings & System
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    showNotification('Settings updated', 'info');
  }, [showNotification]);

  const updateActiveTimerState = useCallback((state: ActiveTimerState | null) => {
    setActiveTimerState(state);
  }, []);

  const loadDemoData = useCallback(() => {
    const demo = generateDemoData();
    setSkills(demo.skills);
    setSessions(demo.sessions);
    setAssignments(demo.assignments);
    setUpcomingSessions(demo.upcoming);
    setSettings(demo.settings);
    saveStoredSkills(demo.skills);
    saveStoredSessions(demo.sessions);
    saveStoredAssignments(demo.assignments);
    saveStoredUpcoming(demo.upcoming);
    saveStoredSettings(demo.settings);
    setStorageInitialized();
    showNotification('Demo data loaded successfully!', 'success');
  }, [showNotification]);

  const clearDemoData = useCallback(() => {
    setSkills([]);
    setSessions([]);
    setAssignments([]);
    setUpcomingSessions([]);
    saveStoredSkills([]);
    saveStoredSessions([]);
    saveStoredAssignments([]);
    saveStoredUpcoming([]);
    setStorageInitialized();
    showNotification('Demo data cleared. Clean slate ready.', 'info');
  }, [showNotification]);

  const clearAllData = useCallback(() => {
    clearAllStoredData();
    setSkills([]);
    setSessions([]);
    setAssignments([]);
    setUpcomingSessions([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveTimerState(null);
    showNotification('All application data has been wiped.', 'warning');
  }, [showNotification]);

  const importJsonData = useCallback((json: string) => {
    const result = importAppData(json);
    if (result.success) {
      setSkills(loadStoredSkills());
      setSessions(loadStoredSessions());
      setAssignments(loadStoredAssignments());
      setUpcomingSessions(loadStoredUpcoming());
      setSettings(loadStoredSettings());
      showNotification('Backup data imported successfully!', 'success');
    } else {
      showNotification(result.message, 'warning');
    }
    return result;
  }, [showNotification]);

  return (
    <AppContext.Provider
      value={{
        skills,
        sessions,
        tasks: assignments,
        assignments,
        upcomingSessions,
        settings,
        activeTimerState,
        currentView,
        preselectedSkillId,
        notification,
        setCurrentView,
        startStudyingSkill,
        showNotification,
        dismissNotification,
        addSkill,
        updateSkill,
        deleteSkill,
        completeSkill,
        reopenSkill,
        addSession,
        deleteSession,
        addTask: addAssignment,
        updateTask: updateAssignment,
        deleteTask: deleteAssignment,
        toggleTask: toggleAssignment,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleAssignment,
        addUpcomingSession,
        updateUpcomingSession,
        deleteUpcomingSession,
        updateSettings,
        updateActiveTimerState,
        loadDemoData,
        clearDemoData,
        clearAllData,
        importJsonData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
