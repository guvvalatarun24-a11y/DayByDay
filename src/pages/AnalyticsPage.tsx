import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Flame, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  BarChart2, 
  PieChart, 
  Layers 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { 
  calculateTotalStudyTime, 
  calculateActiveLearningDays, 
  calculateCurrentStreak, 
  calculateLongestStreak, 
  calculateMissedDays,
  calculateHeatmap,
  calculateWeeklyBreakdown
} from '../utils/calculations';
import { 
  formatDurationHuman, 
  getDaysAgoDateString, 
  getTodayDateString, 
  formatReadableDate 
} from '../utils/dateUtils';
import { StudySession } from '../types';

export const AnalyticsPage: React.FC = () => {
  const { skills, sessions } = useApp();

  // Time filter: '7d' | '30d' | 'all'
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter sessions according to time range
  const filteredSessions = useMemo(() => {
    if (timeFilter === 'all') return sessions;
    const days = timeFilter === '7d' ? 7 : 30;
    const thresholdDateStr = getDaysAgoDateString(days);
    return sessions.filter(s => s.date >= thresholdDateStr);
  }, [sessions, timeFilter]);

  // Calculations for filtered range
  const totalSeconds = calculateTotalStudyTime(filteredSessions);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  const activeDays = calculateActiveLearningDays(filteredSessions);
  const avgSecondsPerActiveDay = activeDays > 0 ? Math.round(totalSeconds / activeDays) : 0;
  
  // Streaks (computed across complete activity history for accuracy)
  const currentStreak = calculateCurrentStreak(sessions);
  const longestStreak = calculateLongestStreak(sessions);
  const missedDaysData = calculateMissedDays(skills, sessions);

  // Weekly breakdown chart
  const weeklyData = calculateWeeklyBreakdown(sessions);
  const maxWeeklySecs = Math.max(
    ...weeklyData.thisWeek.map(p => p.durationSeconds),
    3600
  );

  // Study time by skill breakdown
  const skillStudyBreakdown = useMemo(() => {
    const map: Record<string, { skillName: string; seconds: number; color?: string }> = {};
    skills.forEach(s => {
      map[s.id] = { skillName: s.name, seconds: 0, color: s.color };
    });

    filteredSessions.forEach(sess => {
      if (!map[sess.skillId]) {
        map[sess.skillId] = { skillName: sess.skillName, seconds: 0 };
      }
      map[sess.skillId].seconds += sess.durationSeconds;
    });

    const list = Object.values(map)
      .filter(item => item.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);

    return list;
  }, [skills, filteredSessions]);

  // Heatmap for last 84 days (12 weeks)
  const heatmap = useMemo(() => calculateHeatmap(sessions, 84), [sessions]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/70 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Study Analytics & Insights
          </h2>
          <p className="text-xs text-slate-500">
            Performance metrics, consistency trends, and learning time allocation
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as '7d' | '30d' | 'all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === tab.id
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Study Hours"
          value={totalHours}
          unit="hrs"
          subtitle={formatDurationHuman(totalSeconds)}
          icon={Clock}
          accentColor="purple"
        />
        <MetricCard
          title="Active Learning Days"
          value={activeDays}
          unit="days"
          subtitle={`In selected period`}
          icon={Calendar}
          accentColor="emerald"
        />
        <MetricCard
          title="Avg Study / Active Day"
          value={formatDurationHuman(avgSecondsPerActiveDay)}
          subtitle="Daily intensity"
          icon={TrendingUp}
          accentColor="violet"
        />
        <MetricCard
          title="Current Streak"
          value={currentStreak}
          unit={currentStreak === 1 ? 'day' : 'days'}
          subtitle={currentStreak > 0 ? 'Active unbroken' : 'No activity today'}
          icon={Flame}
          accentColor="amber"
        />
        <MetricCard
          title="Longest Streak"
          value={longestStreak}
          unit={longestStreak === 1 ? 'day' : 'days'}
          subtitle="All-time personal record"
          icon={Trophy}
          accentColor="indigo"
        />
        <MetricCard
          title="Missed Days"
          value={missedDaysData.count}
          unit="days"
          subtitle="Unrecorded past days"
          icon={AlertCircle}
          accentColor={missedDaysData.count > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* 2-Column Section: Weekly Study Time Chart & Study Time by Skill */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Study-Time Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly Study-Time Chart
                </h3>
              </div>
              <span className="text-xs font-semibold text-purple-700 font-mono">
                This week: {formatDurationHuman(weeklyData.thisWeekTotalSeconds)}
              </span>
            </div>

            <div className="pt-4 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end">
                {weeklyData.thisWeek.map((pt, idx) => {
                  const lastWeekPt = weeklyData.lastWeek[idx];
                  const thisWeekHeight = Math.max(10, (pt.durationSeconds / maxWeeklySecs) * 100);
                  const lastWeekHeight = Math.max(10, (lastWeekPt.durationSeconds / maxWeeklySecs) * 100);

                  return (
                    <div key={pt.dayLabel} className="flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-mono font-semibold text-purple-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                        {Math.round(pt.durationSeconds / 60)}m
                      </div>
                      <div className="w-full flex items-end justify-center gap-1.5 h-36">
                        <div
                          style={{ height: `${lastWeekHeight}%` }}
                          className="w-3 sm:w-4 bg-purple-200 rounded-t-md transition-all duration-300"
                          title={`Last week ${pt.dayLabel}: ${formatDurationHuman(lastWeekPt.durationSeconds)}`}
                        />
                        <div
                          style={{ height: `${thisWeekHeight}%` }}
                          className="w-3 sm:w-4 bg-purple-600 rounded-t-md group-hover:bg-purple-700 transition-all duration-300 shadow-xs"
                          title={`This week ${pt.dayLabel}: ${formatDurationHuman(pt.durationSeconds)}`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 mt-2 font-mono">
                        {pt.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Current Week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-200" />
                <span>Previous Week</span>
              </div>
            </div>
            <span>Calculated from real session timestamps</span>
          </div>
        </div>

        {/* Study Time by Skill Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Study Time by Skill
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {timeFilter === 'all' ? 'All time' : timeFilter === '7d' ? '7 days' : '30 days'}
              </span>
            </div>

            {skillStudyBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center italic">
                No study sessions recorded in this time range.
              </p>
            ) : (
              <div className="space-y-3.5">
                {skillStudyBreakdown.map((item, idx) => {
                  const percentage = totalSeconds > 0 ? Math.round((item.seconds / totalSeconds) * 100) : 0;
                  const barColors = [
                    'bg-purple-600',
                    'bg-violet-500',
                    'bg-indigo-500',
                    'bg-fuchsia-500',
                    'bg-purple-400',
                  ];
                  const colorClass = barColors[idx % barColors.length];

                  return (
                    <div key={item.skillName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {item.skillName}
                        </span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span className="text-slate-500">{formatDurationHuman(item.seconds)}</span>
                          <span className="font-bold text-slate-900 w-10 text-right">{percentage}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-purple-50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total allocated: {formatDurationHuman(totalSeconds)}</span>
            <span>{skillStudyBreakdown.length} active skills</span>
          </div>
        </div>
      </div>

      {/* Skill Progress Percentages Comparison */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Skill Progress Percentages
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            0 to 100% curriculum completion
          </span>
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center italic">
            No skills added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{skill.name}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-md ${
                      skill.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {skill.status}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-purple-700 tabular-nums">
                    {skill.progress}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      skill.status === 'Completed' ? 'bg-emerald-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Goal: {skill.dailyStudyGoal}m daily</span>
                  <span>Started: {formatReadableDate(skill.startDate, { shortMonth: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Heatmap (12 Weeks / 84 Days) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Activity Heatmap (Last 12 Weeks)
            </h3>
            <p className="text-xs text-slate-500">
              Visual log of every day you studied over the past 84 days
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Less</span>
            <span className="w-3 h-3 rounded-md bg-slate-100 inline-block" />
            <span className="w-3 h-3 rounded-md bg-purple-100 inline-block" />
            <span className="w-3 h-3 rounded-md bg-purple-300 inline-block" />
            <span className="w-3 h-3 rounded-md bg-purple-500 inline-block" />
            <span className="w-3 h-3 rounded-md bg-purple-700 inline-block" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[680px]">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5">
              {heatmap.map((cell) => {
                const getCellColor = () => {
                  switch (cell.level) {
                    case 4: return 'bg-purple-700 hover:bg-purple-800';
                    case 3: return 'bg-purple-500 hover:bg-purple-600';
                    case 2: return 'bg-purple-300 hover:bg-purple-400';
                    case 1: return 'bg-purple-100 hover:bg-purple-200';
                    default: return 'bg-slate-100 hover:bg-slate-200';
                  }
                };

                return (
                  <div
                    key={cell.dateStr}
                    title={`${formatReadableDate(cell.dateStr)}: ${formatDurationHuman(cell.countSeconds)} studied`}
                    className={`w-3.5 h-3.5 rounded-xs transition-colors cursor-pointer ${getCellColor()}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Missed Study Days Breakdown Log */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Missed Study Days Log
            </h3>
            <p className="text-xs text-slate-500">
              Days without recorded study sessions since your earliest skill start date
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            {missedDaysData.count} missed {missedDaysData.count === 1 ? 'day' : 'days'}
          </span>
        </div>

        {missedDaysData.count === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium">
            Awesome consistency! You have recorded study sessions on all expected study days.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {missedDaysData.missedDates.slice(0, 10).map(dStr => (
              <div
                key={dStr}
                className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="font-mono text-slate-700">
                  {formatReadableDate(dStr)}
                </span>
                <span className="text-rose-600 font-semibold text-[11px]">
                  No study recorded
                </span>
              </div>
            ))}
            {missedDaysData.missedDates.length > 10 && (
              <p className="text-center text-[11px] text-slate-400 pt-1">
                + {missedDaysData.missedDates.length - 10} earlier unrecorded dates
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
