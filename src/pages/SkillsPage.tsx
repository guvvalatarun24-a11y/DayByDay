import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Skill } from '../types';
import { 
  formatReadableDate, 
  formatDurationHuman, 
  getCalendarDaysDiff 
} from '../utils/dateUtils';
import { 
  calculateSkillStudyTime, 
  calculateSkillActiveDays, 
  calculateDaysSinceStarting 
} from '../utils/calculations';
import { SkillDetailModal } from '../components/modals/SkillDetailModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

interface SkillsPageProps {
  onOpenAddSkill: () => void;
  onEditSkill: (skill: Skill) => void;
}

export const SkillsPage: React.FC<SkillsPageProps> = ({
  onOpenAddSkill,
  onEditSkill,
}) => {
  const { 
    skills, 
    sessions, 
    assignments, 
    startStudyingSkill, 
    completeSkill, 
    reopenSkill, 
    deleteSkill 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [selectedSkillForDetail, setSelectedSkillForDetail] = useState<Skill | null>(null);
  const [skillToDeleteId, setSkillToDeleteId] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skill.category && skill.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'All' ? true : skill.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [skills, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, Add Skill Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/70 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skills by name, description, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          {/* Status Filter Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            {(['All', 'In Progress', 'Completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenAddSkill}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm shadow-purple-200 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-purple-100/70 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {skills.length === 0 ? 'No skills tracked yet' : 'No matching skills found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {skills.length === 0
              ? 'Start tracking your technical or creative skills with custom goals, study timers, and milestone metrics.'
              : 'Try clearing your search query or switching your status filter to see other skills.'}
          </p>
          {skills.length === 0 ? (
            <button
              onClick={onOpenAddSkill}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
            >
              Add Your First Skill
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSkills.map(skill => {
            const isCompleted = skill.status === 'Completed';
            const totalStudySeconds = calculateSkillStudyTime(skill.id, sessions);
            const activeDays = calculateSkillActiveDays(skill.id, sessions);
            const daysSinceStart = calculateDaysSinceStarting(skill);
            
            // Elapsed calendar days if completed
            const elapsedDaysOnCompletion = isCompleted && skill.completedDate
              ? getCalendarDaysDiff(skill.startDate, skill.completedDate)
              : null;

            return (
              <div
                key={skill.id}
                className="bg-white rounded-2xl p-5 border border-purple-100/80 hover:border-purple-300 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {skill.status}
                      </span>
                      {skill.category && (
                        <span className="text-xs text-slate-400 font-medium">
                          · {skill.category}
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      {skill.progress}%
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedSkillForDetail(skill)}
                    className="text-base font-bold text-slate-900 hover:text-purple-700 cursor-pointer transition-colors"
                  >
                    {skill.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {skill.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Completion Banner if completed */}
                  {isCompleted && elapsedDaysOnCompletion !== null && (
                    <div className="mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">Completed</span>
                      </div>
                      <span className="font-mono font-bold">
                        {elapsedDaysOnCompletion} {elapsedDaysOnCompletion === 1 ? 'day' : 'days'} elapsed
                      </span>
                    </div>
                  )}

                  {/* 4 Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>Study Time</span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {formatDurationHuman(totalStudySeconds)}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        <span>Active Days</span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {activeDays} {activeDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                        <TrendingUp className="w-3 h-3 text-purple-600" />
                        <span>Days Since Start</span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                        <span>Daily Goal</span>
                      </div>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">
                        {skill.dailyStudyGoal}m / day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (All 6 Explicitly Required) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedSkillForDetail(skill)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="View Details"
                    >
                      Details
                    </button>

                    {/* Edit Skill */}
                    <button
                      onClick={() => onEditSkill(skill)}
                      className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit Skill"
                      aria-label="Edit Skill"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Mark as Completed / Reopen */}
                    {isCompleted ? (
                      <button
                        onClick={() => reopenSkill(skill.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Reopen Skill"
                        aria-label="Reopen Skill"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => completeSkill(skill.id)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark as Completed"
                        aria-label="Mark as Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Skill */}
                    <button
                      onClick={() => setSkillToDeleteId(skill.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Skill"
                      aria-label="Delete Skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Start Studying */}
                  <button
                    onClick={() => startStudyingSkill(skill.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-xs"
                    title="Start Studying"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Study</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Detail Modal */}
      {selectedSkillForDetail && (
        <SkillDetailModal
          isOpen={!!selectedSkillForDetail}
          onClose={() => setSelectedSkillForDetail(null)}
          skill={selectedSkillForDetail}
          sessions={sessions}
          assignments={assignments}
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
        message="Are you sure you want to delete this skill? All past study session logs and assignments will be retained, but the skill card and tracker will be deleted."
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
