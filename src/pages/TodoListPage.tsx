import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  ListTodo
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { isTaskOverdue, getTaskDeadlineInfo } from '../utils/dateUtils';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface TodoListPageProps {
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TodoListPage: React.FC<TodoListPageProps> = ({
  onOpenAddTask,
  onEditTask,
}) => {
  const { tasks, toggleTask, deleteTask } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('All');
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // Sorting and filtering tasks
  const sortedAndFilteredTasks = useMemo(() => {
    // Sort primarily by deadline (date + time ascending)
    const sorted = [...tasks].sort((a, b) => {
      // Pending first, then Completed
      if (a.status !== b.status) {
        return a.status === 'Pending' ? -1 : 1;
      }
      const dateCmp = a.dueDate.localeCompare(b.dueDate);
      if (dateCmp !== 0) return dateCmp;
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      return timeA.localeCompare(timeB);
    });

    return sorted.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.skillName && task.skillName.toLowerCase().includes(searchQuery.toLowerCase()));

      const isOverdue = isTaskOverdue(task.dueDate, task.dueTime, task.status);

      let matchesFilter = true;
      if (filterTab === 'Pending') {
        matchesFilter = task.status === 'Pending';
      } else if (filterTab === 'Completed') {
        matchesFilter = task.status === 'Completed';
      } else if (filterTab === 'Overdue') {
        matchesFilter = isOverdue;
      }

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, filterTab]);

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      overdue: tasks.filter(t => isTaskOverdue(t.dueDate, t.dueTime, t.status)).length,
    };
  }, [tasks]);

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

  return (
    <div className="space-y-6">
      {/* Header controls: Search, Filter Tabs, Add Task button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/70 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your to-do tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
            {[
              { id: 'All', label: 'All', count: counts.all },
              { id: 'Pending', label: 'Pending', count: counts.pending },
              { id: 'Completed', label: 'Completed', count: counts.completed },
              { id: 'Overdue', label: 'Overdue', count: counts.overdue, isAlert: counts.overdue > 0 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  filterTab === tab.id
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  tab.isAlert ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenAddTask}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm shadow-purple-200 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task List Container */}
      {sortedAndFilteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-purple-100/70 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
            <ListTodo className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {tasks.length === 0 ? 'Your To-Do List is empty' : 'No tasks match current filter'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {tasks.length === 0
              ? 'Add tasks for reading chapters, writing code, solving practice problems, or project deliverables.'
              : 'Try searching for something else or switch to the "All" tab.'}
          </p>
          {tasks.length === 0 ? (
            <button
              onClick={onOpenAddTask}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
            >
              Add Your First Task
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTab('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-purple-100/70 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {sortedAndFilteredTasks.map(task => {
            const isCompleted = task.status === 'Completed';
            const deadlineInfo = getTaskDeadlineInfo(task.dueDate, task.dueTime, task.status);

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                  isCompleted
                    ? 'bg-slate-50/40 text-slate-400'
                    : deadlineInfo.isOverdue
                    ? 'bg-rose-50/20 hover:bg-rose-50/40'
                    : 'hover:bg-purple-50/20'
                }`}
              >
                {/* Left: Checkbox + Title + Meta */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : deadlineInfo.isOverdue
                        ? 'border-rose-400 hover:border-purple-600 bg-white'
                        : 'border-slate-300 hover:border-purple-600 bg-white'
                    }`}
                    aria-label={isCompleted ? 'Reopen task' : 'Mark task completed'}
                    title={isCompleted ? 'Click to reopen task' : 'Click to mark completed'}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        onClick={() => onEditTask(task)}
                        className={`text-sm sm:text-base font-bold cursor-pointer transition-colors ${
                          isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 hover:text-purple-700'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Priority Tag */}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Deadline Label (Red if overdue, purple if today) */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-500'
                            : deadlineInfo.isOverdue
                            ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200'
                            : deadlineInfo.isToday
                            ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200'
                            : deadlineInfo.isTomorrow
                            ? 'bg-amber-100 text-amber-800 font-semibold'
                            : 'bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{deadlineInfo.label}</span>
                      </span>
                    </div>

                    {task.description && (
                      <p className={`text-xs ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'} line-clamp-2`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                      {task.skillName && (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100/60">
                          {task.skillName}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="text-emerald-700 font-medium">
                          Completed on {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Edit / Reopen / Delete Buttons */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  {isCompleted && (
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Reopen task"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit task"
                    aria-label="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setTaskToDeleteId(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete task"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!taskToDeleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task from your To-Do List? This cannot be undone."
        confirmLabel="Delete Task"
        isDestructive={true}
        onConfirm={() => {
          if (taskToDeleteId) {
            deleteTask(taskToDeleteId);
            setTaskToDeleteId(null);
          }
        }}
        onCancel={() => setTaskToDeleteId(null)}
      />
    </div>
  );
};
