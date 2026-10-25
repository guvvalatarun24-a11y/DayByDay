import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Timer, 
  BarChart3, 
  CheckSquare, 
  Calendar, 
  Settings, 
  Flame, 
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import { calculateCurrentStreak } from '../../utils/calculations';

import { isTaskOverdue } from '../../utils/dateUtils';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { 
    currentView, 
    setCurrentView, 
    tasks, 
    sessions, 
    activeTimerState,
    skills 
  } = useApp();

  const currentStreak = calculateCurrentStreak(sessions);
  const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;
  const overdueCount = tasks.filter(t => isTaskOverdue(t.dueDate, t.dueTime, t.status)).length;

  const navItems: { id: NavigationPage; label: string; icon: React.ElementType; badge?: number; badgeAlert?: boolean; isPulsing?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skills', label: 'My Skills', icon: BookOpen, badge: skills.length > 0 ? skills.length : undefined },
    { 
      id: 'timer', 
      label: 'Study Timer', 
      icon: Timer,
      isPulsing: activeTimerState?.isRunning 
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { 
      id: 'todos', 
      label: 'To-Do List', 
      icon: CheckSquare, 
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined 
    },
    { 
      id: 'upcoming-tasks', 
      label: 'Upcoming Tasks', 
      icon: Calendar,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeAlert: overdueCount > 0
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId: NavigationPage) => {
    setCurrentView(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-purple-100/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="p-6 pb-4 border-b border-purple-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <img
                  src="/daybyday-logo.png"
                  alt="DayByDay Logo"
                  className="w-full h-full object-contain rounded-lg filter drop-shadow-xs"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                DayByDay
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Small Steps. Every Day.
            </p>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Highlight Widget */}
        <div className="px-4 py-3 mx-4 my-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white text-amber-500 shadow-xs border border-purple-100/50">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide">
                Active Streak
              </div>
              <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>
          {currentStreak > 0 && (
            <span className="text-xs font-medium text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
              On fire!
            </span>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.isPulsing && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono tabular-nums font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeAlert
                          ? 'bg-rose-100 text-rose-700 font-bold'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-purple-50 text-center">
          <p className="text-[11px] text-slate-400">
            DayByDay v1.0 · Local Storage
          </p>
        </div>
      </aside>
    </>
  );
};
