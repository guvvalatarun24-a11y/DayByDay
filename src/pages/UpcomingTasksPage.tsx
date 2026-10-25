import React from 'react';
import { 
  Plus, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Check, 
  Edit3, 
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { 
  getTodayDateString, 
  getDaysAgoDateString, 
  getCalendarDaysDiff, 
  isTaskOverdue, 
  getTaskDeadlineInfo 
} from '../utils/dateUtils';

interface UpcomingTasksPageProps {
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export const UpcomingTasksPage: React.FC<UpcomingTasksPageProps> = ({
  onOpenAddTask,
  onEditTask,
}) => {
  const { tasks, toggleTask, setCurrentView } = useApp();

  const todayStr = getTodayDateString();
  const tomorrowStr = getDaysAgoDateString(-1);

  // Group pending tasks into requested buckets:
  // 1. Overdue tasks
  // 2. Tasks due today
  // 3. Tasks due tomorrow
  // 4. Tasks due in the next 7 days
  // 5. Later tasks
  const overdueTasks: Task[] = [];
  const dueTodayTasks: Task[] = [];
  const dueTomorrowTasks: Task[] = [];
  const next7DaysTasks: Task[] = [];
  const laterTasks: Task[] = [];
  const completedTasks: Task[] = [];

  // Sort tasks by deadline date and time
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateCmp = a.dueDate.localeCompare(b.dueDate);
    if (dateCmp !== 0) return dateCmp;
    const timeA = a.dueTime || '23:59';
    const timeB = b.dueTime || '23:59';
    return timeA.localeCompare(timeB);
  });

  sortedTasks.forEach(task => {
    if (task.status === 'Completed') {
      completedTasks.push(task);
      return;
    }

    if (isTaskOverdue(task.dueDate, task.dueTime, task.status)) {
      overdueTasks.push(task);
      return;
    }

    if (task.dueDate === todayStr) {
      dueTodayTasks.push(task);
      return;
    }

    if (task.dueDate === tomorrowStr) {
      dueTomorrowTasks.push(task);
      return;
    }

    const diffDays = getCalendarDaysDiff(todayStr, task.dueDate);
    if (diffDays > 1 && diffDays <= 7) {
      next7DaysTasks.push(task);
    } else if (diffDays > 7) {
      laterTasks.push(task);
    } else {
      // Past non-overdue edge cases
      overdueTasks.push(task);
    }
  });

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'High':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Low':
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const renderTaskRow = (task: Task, isOverdue = false) => {
    const isCompleted = task.status === 'Completed';
    const deadlineInfo = getTaskDeadlineInfo(task.dueDate, task.dueTime, task.status);

    return (
      <div
        key={task.id}
        className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
          isCompleted
            ? 'bg-slate-50/50 border-slate-200/60 opacity-70'
            : isOverdue
            ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
            : 'bg-white border-purple-100/80 hover:border-purple-300 hover:shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Completion Checkbox */}
          <button
            onClick={() => toggleTask(task.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isCompleted
                ? 'bg-purple-600 border-purple-600 text-white'
                : isOverdue
                ? 'border-rose-400 hover:border-purple-600 bg-white'
                : 'border-slate-300 hover:border-purple-600 bg-white'
            }`}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            title={isCompleted ? 'Click to reopen' : 'Click to complete'}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                onClick={() => onEditTask(task)}
                className={`text-sm font-bold truncate cursor-pointer transition-colors ${
                  isCompleted
                    ? 'line-through text-slate-400'
                    : 'text-slate-900 hover:text-purple-700'
                }`}
              >
                {task.title}
              </span>

              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className={`inline-flex items-center gap-1 font-mono font-medium ${
                isOverdue ? 'text-rose-600 font-bold' : ''
              }`}>
                <Clock className="w-3 h-3" />
                <span>{deadlineInfo.label}</span>
              </span>

              {task.skillName && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-purple-700">
                    {task.skillName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEditTask(task)}
          className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors shrink-0"
          title="Edit task details"
          aria-label="Edit task details"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const totalPending = tasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Upcoming Tasks Timeline
          </h2>
          <p className="text-xs text-slate-500">
            Sorted chronologically by deadline date and time ({totalPending} pending tasks)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('todos')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Open To-Do List
          </button>
          <button
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-purple-100/70 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            No upcoming tasks scheduled
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Add learning tasks with deadlines to see them organized chronologically right here.
          </p>
          <button
            onClick={onOpenAddTask}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
          >
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Overdue Tasks (Shown prominently in red if any) */}
          {overdueTasks.length > 0 && (
            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wide">
                    Overdue Tasks ({overdueTasks.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-rose-700 font-mono">
                  Needs attention
                </span>
              </div>
              <div className="space-y-2">
                {overdueTasks.map(task => renderTaskRow(task, true))}
              </div>
            </div>
          )}

          {/* Section 2: Tasks Due Today */}
          <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                <h3 className="text-sm font-bold text-slate-900">
                  Due Today
                </h3>
              </div>
              <span className="text-xs font-semibold text-purple-700 font-mono">
                {dueTodayTasks.length} {dueTodayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {dueTodayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                No tasks due today. You are all caught up for today!
              </p>
            ) : (
              <div className="space-y-2">
                {dueTodayTasks.map(task => renderTaskRow(task))}
              </div>
            )}
          </div>

          {/* Section 3: Tasks Due Tomorrow */}
          <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <h3 className="text-sm font-bold text-slate-900">
                  Due Tomorrow
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {dueTomorrowTasks.length} {dueTomorrowTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {dueTomorrowTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                No tasks scheduled for tomorrow.
              </p>
            ) : (
              <div className="space-y-2">
                {dueTomorrowTasks.map(task => renderTaskRow(task))}
              </div>
            )}
          </div>

          {/* Section 4: Tasks Due in the Next 7 Days */}
          <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
                <h3 className="text-sm font-bold text-slate-900">
                  Due in the Next 7 Days
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {next7DaysTasks.length} {next7DaysTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {next7DaysTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                No other tasks due within the upcoming week.
              </p>
            ) : (
              <div className="space-y-2">
                {next7DaysTasks.map(task => renderTaskRow(task))}
              </div>
            )}
          </div>

          {/* Section 5: Later Tasks */}
          {laterTasks.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Later Tasks
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {laterTasks.length} {laterTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div className="space-y-2">
                {laterTasks.map(task => renderTaskRow(task))}
              </div>
            </div>
          )}

          {/* Recently Completed Tasks Summary */}
          {completedTasks.length > 0 && (
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>{completedTasks.length}</strong> tasks completed so far. Great work!
                </span>
              </div>
              <button
                onClick={() => setCurrentView('todos')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                View all in To-Do List →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
