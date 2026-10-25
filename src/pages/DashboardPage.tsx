import React, { useState } from 'react';
import { 
  Clock, 
  Flame, 
  Trophy, 
  Target, 
  Calendar, 
  AlertCircle, 
  Play, 
  Plus, 
  CheckSquare, 
  ArrowRight,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { 
  calculateTotalStudyTime, 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  calculateOverallProgress, 
  calculateActiveLearningDays, 
  calculateMissedDays,
  calculateWeeklyBreakdown,
  calculateSkillStudyTime,
  calculateHeatmap
} from '../utils/calculations';
import { 
  formatDurationHuman, 
  formatReadableDate, 
  isTaskOverdue, 
  getTaskDeadlineInfo 
} from '../utils/dateUtils';
import { Skill, Task } from '../types';
import { SkillDetailModal } from '../components/modals/SkillDetailModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface DashboardPageProps {
  onOpenAddSkill: () => void;
  onOpenAddTask: () => void;
  onEditSkill: (skill: Skill) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddSkill,
  onOpenAddTask,
  onEditSkill,
}) => {
  const { 
    skills, 
    sessions, 
    tasks, 
    setCurrentView, 
    startStudyingSkill,
    toggleTask,
    completeSkill,
    reopenSkill,
    deleteSkill
  } = useApp();

  const [selectedSkillForDetail, setSelectedSkillForDetail] = useState<Skill | null>(null);
  const [skillToDeleteId, setSkillToDeleteId] = useState<string | null>(null);

  // Exact calculations required by the prompt
  const totalStudySeconds = calculateTotalStudyTime(sessions);
  const currentStreak = calculateCurrentStreak(sessions);
  const longestStreak = calculateLongestStreak(sessions);
  const overallProgress = calculateOverallProgress(skills);
  const activeLearningDays = calculateActiveLearningDays(sessions);
  const missedDaysData = calculateMissedDays(skills, sessions);
  const weeklyData = calculateWeeklyBreakdown(sessions);
  const heatmap = calculateHeatmap(sessions, 28); // Last 4 weeks mini heatmap

  const recentSessions = [...sessions].slice(0, 5);

  // Next five pending tasks sorted by deadline
  const pendingTasksSorted = [...tasks]
    .filter(t => t.status === 'Pending')
    .sort((a, b) => {
      const dateCmp = a.dueDate.localeCompare(b.dueDate);
      if (dateCmp !== 0) return dateCmp;
      const timeA = a.dueTime || '23:59';
      const timeB = b.dueTime || '23:59';
      return timeA.localeCompare(timeB);
    });

  const nextFiveUpcomingTasks = pendingTasksSorted.slice(0, 5);
  const overdueCount = tasks.filter(t => isTaskOverdue(t.dueDate, t.dueTime, t.status)).length;

  // Maximum value for weekly chart scaling
  const maxWeeklySecs = Math.max(
    ...weeklyData.thisWeek.map(p => p.durationSeconds),
    ...weeklyData.lastWeek.map(p => p.durationSeconds),
    3600 // minimum 1h bar height
  );

  return (
    <div className="space-y-6">
      {/* 6 Core Required KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Study Time"
          value={formatDurationHuman(totalStudySeconds)}
          subtitle="All recorded sessions"
          icon={Clock}
          accentColor="purple"
        />
        <MetricCard
          title="Current Streak"
          value={currentStreak}
          unit={currentStreak === 1 ? 'day' : 'days'}
          subtitle={currentStreak > 0 ? 'Consecutive days active' : 'Study today to start!'}
          icon={Flame}
          accentColor="amber"
          trendLabel={currentStreak >= 3 ? '🔥 High momentum' : undefined}
        />
        <MetricCard
          title="Longest Streak"
          value={longestStreak}
          unit={longestStreak === 1 ? 'day' : 'days'}
          subtitle="Personal best"
          icon={Trophy}
          accentColor="indigo"
        />
        <MetricCard
          title="Overall Progress"
          value={`${overallProgress}%`}
          subtitle={`Across ${skills.length} skills`}
          icon={Target}
          accentColor="violet"
        />
        <MetricCard
          title="Active Days"
          value={activeLearningDays}
          unit="days"
          subtitle="Unique session dates"
          icon={Calendar}
          accentColor="emerald"
        />
        <MetricCard
          title="Missed Days"
          value={missedDaysData.count}
          unit="days"
          subtitle={missedDaysData.count === 0 ? 'Flawless consistency!' : 'Unrecorded past days'}
          icon={AlertCircle}
          accentColor={missedDaysData.count > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* Quick Action CTA Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 rounded-2xl p-5 text-white shadow-md shadow-purple-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">
            Ready to sharpen your skills today?
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl">
            Pick a skill, start the precision timer, and keep your {currentStreak}-day learning streak moving forward.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddSkill}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
          <button
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setCurrentView('timer')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-white text-purple-700 hover:bg-purple-50 rounded-xl transition-colors shadow-sm"
          >
            <Play className="w-4 h-4 fill-purple-700" />
            <span>Start Studying</span>
          </button>
        </div>
      </div>

      {/* Grid: Weekly Study Chart & Activity Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Study Comparison Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Weekly Study Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  This week ({formatDurationHuman(weeklyData.thisWeekTotalSeconds)}) vs Last week ({formatDurationHuman(weeklyData.lastWeekTotalSeconds)})
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-600 inline-block" />
                  <span className="text-slate-600">This Week</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-200 inline-block" />
                  <span className="text-slate-600">Last Week</span>
                </div>
              </div>
            </div>

            {/* Custom SVG/Bar Visualizer */}
            <div className="pt-4 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 h-44 items-end">
                {weeklyData.thisWeek.map((pt, idx) => {
                  const lastWeekPt = weeklyData.lastWeek[idx];
                  const thisWeekHeight = Math.max(8, (pt.durationSeconds / maxWeeklySecs) * 100);
                  const lastWeekHeight = Math.max(8, (lastWeekPt.durationSeconds / maxWeeklySecs) * 100);

                  return (
                    <div key={pt.dayLabel} className="flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-36 relative">
                        {/* Last week bar */}
                        <div
                          style={{ height: `${lastWeekHeight}%` }}
                          className="w-2.5 sm:w-3.5 bg-purple-200 rounded-t-md transition-all duration-300"
                          title={`Last week ${lastWeekPt.dayLabel}: ${formatDurationHuman(lastWeekPt.durationSeconds)}`}
                        />
                        {/* This week bar */}
                        <div
                          style={{ height: `${thisWeekHeight}%` }}
                          className="w-2.5 sm:w-3.5 bg-purple-600 rounded-t-md group-hover:bg-purple-700 transition-all duration-300 shadow-xs"
                          title={`This week ${pt.dayLabel}: ${formatDurationHuman(pt.durationSeconds)}`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 mt-2 font-mono">
                        {pt.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-slate-500">
            <span>Highest active day this week: {formatDurationHuman(Math.max(...weeklyData.thisWeek.map(p => p.durationSeconds)))}</span>
            <button
              onClick={() => setCurrentView('analytics')}
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
            >
              <span>View full analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 28-Day Activity Heatmap Calendar (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Activity Calendar (Last 4 Weeks)
              </h3>
              <span className="text-xs font-semibold text-purple-700 font-mono">
                {activeLearningDays} active days
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Daily study frequency and consistency intensity
            </p>

            {/* 4 rows x 7 days grid */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-slate-400">
                  {d}
                </div>
              ))}
              {heatmap.map((cell) => {
                const getCellColor = () => {
                  switch (cell.level) {
                    case 4: return 'bg-purple-700 text-white';
                    case 3: return 'bg-purple-500 text-white';
                    case 2: return 'bg-purple-300 text-slate-800';
                    case 1: return 'bg-purple-100 text-purple-900';
                    default: return 'bg-slate-100 text-slate-400 hover:bg-slate-200';
                  }
                };

                return (
                  <div
                    key={cell.dateStr}
                    title={`${formatReadableDate(cell.dateStr)}: ${formatDurationHuman(cell.countSeconds)}`}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono font-medium transition-all cursor-pointer ${getCellColor()}`}
                  >
                    {cell.dateStr.slice(8)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-purple-50 flex items-center justify-between text-[11px] text-slate-500">
            <span>Less</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100" />
              <span className="w-3 h-3 rounded-md bg-purple-100" />
              <span className="w-3 h-3 rounded-md bg-purple-300" />
              <span className="w-3 h-3 rounded-md bg-purple-500" />
              <span className="w-3 h-3 rounded-md bg-purple-700" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* My Skills Summary Section */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              My Skills Summary
            </h3>
            <span className="text-xs font-semibold text-slate-400 font-mono">
              ({skills.length})
            </span>
          </div>
          <button
            onClick={() => setCurrentView('skills')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Manage all skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-purple-200 rounded-xl bg-purple-50/30">
            <p className="text-sm text-slate-600">No skills added yet.</p>
            <button
              onClick={onOpenAddSkill}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-sm"
            >
              Add Your First Skill
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {skills.map(skill => {
              const studySecs = calculateSkillStudyTime(skill.id, sessions);
              return (
                <div
                  key={skill.id}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-purple-300 transition-all bg-slate-50/50 hover:bg-white flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        skill.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {skill.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                        {skill.progress}%
                      </span>
                    </div>

                    <h4 
                      onClick={() => setSelectedSkillForDetail(skill)}
                      className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-purple-700 cursor-pointer"
                    >
                      {skill.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                      {skill.description || 'No description'}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>Total: <strong className="text-slate-800 font-mono">{formatDurationHuman(studySecs)}</strong></span>
                      <span>Goal: <strong className="text-slate-800 font-mono">{skill.dailyStudyGoal}m</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSkillForDetail(skill)}
                        className="flex-1 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => startStudyingSkill(skill.id)}
                        className="flex-1 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Study</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3 Lower Columns: Recent Sessions, Upcoming Assignments, Upcoming Study Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Study Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Sessions
              </h3>
              <button
                onClick={() => setCurrentView('timer')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                Timer log
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No study sessions recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map(sess => (
                  <div
                    key={sess.id}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/40 border border-slate-100 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {sess.skillName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {formatReadableDate(sess.date, { shortMonth: true })} · {sess.startTime}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-purple-700 font-mono tabular-nums bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {formatDurationHuman(sess.durationSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentView('timer')}
            className="w-full mt-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200/60"
          >
            Start New Session
          </button>
        </div>

        {/* To-Do List Card */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                To-Do List
              </h3>
              <button
                onClick={() => setCurrentView('todos')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                View list ({pendingTasksSorted.length})
              </button>
            </div>

            {pendingTasksSorted.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                All tasks are caught up! 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {pendingTasksSorted.slice(0, 4).map(task => {
                  const deadlineInfo = getTaskDeadlineInfo(task.dueDate, task.dueTime, task.status);
                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                        deadlineInfo.isOverdue
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-slate-50 hover:bg-purple-50/40 border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:border-purple-600 transition-colors shrink-0 flex items-center justify-center cursor-pointer bg-white"
                          aria-label="Mark task completed"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {task.skillName || 'General Task'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          deadlineInfo.isOverdue 
                            ? 'bg-rose-100 text-rose-700 font-bold' 
                            : deadlineInfo.isToday
                            ? 'bg-purple-100 text-purple-800 font-bold'
                            : 'bg-slate-200/70 text-slate-700'
                        }`}>
                          {deadlineInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddTask}
            className="w-full mt-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            + Add Task
          </button>
        </div>

        {/* Upcoming Tasks Card (Replacing Upcoming Sessions Card) */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Upcoming Tasks
                </h3>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              <button
                onClick={() => setCurrentView('upcoming-tasks')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                Timeline
              </button>
            </div>

            {nextFiveUpcomingTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No upcoming pending tasks found.
              </p>
            ) : (
              <div className="space-y-2">
                {nextFiveUpcomingTasks.map(task => {
                  const deadlineInfo = getTaskDeadlineInfo(task.dueDate, task.dueTime, task.status);
                  const isHighPriority = task.priority === 'High';
                  const isMediumPriority = task.priority === 'Medium';

                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2.5 ${
                        deadlineInfo.isOverdue
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50 hover:bg-purple-50/30 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                            deadlineInfo.isOverdue
                              ? 'border-rose-400 hover:border-purple-600 bg-white'
                              : 'border-slate-300 hover:border-purple-600 bg-white'
                          }`}
                          aria-label="Mark task completed"
                          title="Mark completed"
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-slate-800 truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className={deadlineInfo.isOverdue ? 'text-rose-600 font-bold' : ''}>
                              {deadlineInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          isHighPriority
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isMediumPriority
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setCurrentView('todos')}
            className="w-full mt-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200/60"
          >
            View All Tasks
          </button>
        </div>
      </div>

      {/* Skill Detail Modal */}
      {selectedSkillForDetail && (
        <SkillDetailModal
          isOpen={!!selectedSkillForDetail}
          onClose={() => setSelectedSkillForDetail(null)}
          skill={selectedSkillForDetail}
          sessions={sessions}
          assignments={tasks}
          onEdit={(s) => {
            setSelectedSkillForDetail(null);
            onEditSkill(s);
          }}
          onStartStudying={(skillId) => {
            setSelectedSkillForDetail(null);
            startStudyingSkill(skillId);
          }}
          onComplete={(skillId) => completeSkill(skillId)}
          onReopen={(skillId) => reopenSkill(skillId)}
          onDelete={(skillId) => {
            setSelectedSkillForDetail(null);
            setSkillToDeleteId(skillId);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!skillToDeleteId}
        title="Delete Skill"
        message="Are you sure you want to delete this skill? All past sessions and assignments associated with this skill will be retained in history, but this skill card will be removed."
        confirmLabel="Delete Skill"
        isDestructive={true}
        onConfirm={() => {
          if (skillToDeleteId) {
            deleteSkill(skillToDeleteId);
            setSkillToDeleteId(null);
          }
        }}
        onCancel={() => setSkillToDeleteId(null)}
      />
    </div>
  );
};
