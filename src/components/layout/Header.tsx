import React from 'react';
import { Menu, Plus, Play, CheckSquare, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, formatReadableDate } from '../../utils/dateUtils';

interface HeaderProps {
  onOpenMobile: () => void;
  onOpenAddSkillModal: () => void;
  onOpenAddTaskModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  onOpenAddSkillModal,
  onOpenAddTaskModal,
}) => {
  const { currentView, setCurrentView } = useApp();

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'skills':
        return 'My Skills';
      case 'timer':
        return 'Study Timer';
      case 'analytics':
        return 'Learning Analytics';
      case 'assignments':
      case 'todos':
        return 'To-Do List';
      case 'upcoming':
      case 'upcoming-tasks':
        return 'Upcoming Tasks';
      case 'settings':
        return 'Settings & Preferences';
      default:
        return 'Dashboard';
    }
  };

  const todayStr = getTodayDateString();
  const formattedToday = formatReadableDate(todayStr, { shortMonth: false });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-purple-100/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Title & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-purple-50 rounded-xl transition-colors"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {getPageTitle()}
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>{formattedToday}</span>
            </div>
          </div>
        </div>

        {/* Right Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenAddSkillModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Skill</span>
            <span className="md:hidden">Skill</span>
          </button>

          <button
            onClick={onOpenAddTaskModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <CheckSquare className="w-4 h-4 text-purple-600" />
            <span className="hidden md:inline">Add Task</span>
            <span className="md:hidden">Task</span>
          </button>

          <button
            onClick={() => setCurrentView('timer')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm shadow-purple-200"
          >
            <Play className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Start Studying</span>
            <span className="sm:hidden">Study</span>
          </button>
        </div>
      </div>
    </header>
  );
};
