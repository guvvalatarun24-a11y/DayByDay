import React from 'react';
import { 
  Play, 
  Edit3, 
  CheckCircle2, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckSquare, 
  FileText 
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Skill, StudySession, Assignment } from '../../types';
import { 
  formatReadableDate, 
  formatDurationHuman, 
  getCalendarDaysDiff 
} from '../../utils/dateUtils';
import { 
  calculateSkillStudyTime, 
  calculateSkillActiveDays, 
  calculateDaysSinceStarting 
} from '../../utils/calculations';

interface SkillDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: Skill | null;
  sessions: StudySession[];
  assignments: Assignment[];
  onEdit: (skill: Skill) => void;
  onStartStudying: (skillId: string) => void;
  onComplete: (skillId: string) => void;
  onReopen: (skillId: string) => void;
  onDelete: (skillId: string) => void;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  isOpen,
  onClose,
  skill,
  sessions,
  assignments,
  onEdit,
  onStartStudying,
  onComplete,
  onReopen,
  onDelete,
}) => {
  if (!skill) return null;

  const totalStudySeconds = calculateSkillStudyTime(skill.id, sessions);
  const activeDays = calculateSkillActiveDays(skill.id, sessions);
  const daysSinceStart = calculateDaysSinceStarting(skill);
  
  // Calculate elapsed calendar days between start date and completion date
  const isCompleted = skill.status === 'Completed';
  const elapsedDaysOnCompletion = isCompleted && skill.completedDate
    ? getCalendarDaysDiff(skill.startDate, skill.completedDate)
    : null;

  const relatedSessions = sessions.filter(s => s.skillId === skill.id);
  const relatedAssignments = assignments.filter(a => a.skillId === skill.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skill.name}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header Badges & Description */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              isCompleted 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {skill.status}
            </span>
            {skill.category && (
              <span className="text-xs text-slate-500 font-medium">
                {skill.category}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Started {formatReadableDate(skill.startDate)}
            </span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {skill.description || 'No description provided for this skill.'}
          </p>
        </div>

        {/* Progress & Milestone Bar */}
        <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl">
          <div className="flex items-center justify-between text-sm font-semibold mb-2">
            <span className="text-slate-700">Course Progress</span>
            <span className="text-purple-700 font-mono tabular-nums">{skill.progress}%</span>
          </div>
          <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-purple-100">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${skill.progress}%` }}
            />
          </div>

          {/* Completion Celebration banner */}
          {isCompleted && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-900">
                  Completed on {formatReadableDate(skill.completedDate || '')}
                </span>
              </div>
              {elapsedDaysOnCompletion !== null && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-md font-mono">
                  {elapsedDaysOnCompletion} {elapsedDaysOnCompletion === 1 ? 'calendar day' : 'calendar days'} total
                </span>
              )}
            </div>
          )}
        </div>

        {/* 4 Key Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Study Time</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {formatDurationHuman(totalStudySeconds)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Active Days</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {activeDays} {activeDays === 1 ? 'day' : 'days'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>Days Elapsed</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>Daily Goal</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
              {skill.dailyStudyGoal}m / day
            </div>
          </div>
        </div>

        {/* Notes & Resources */}
        {skill.notes && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Study Notes & Resources</span>
            </div>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              {skill.notes}
            </p>
          </div>
        )}

        {/* Related Recent Sessions */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Recorded Sessions ({relatedSessions.length})
          </h3>
          {relatedSessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No study sessions recorded yet for this skill.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {relatedSessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-medium text-slate-800">{formatReadableDate(s.date, { shortMonth: true })}</span>
                    {s.notes && <span className="text-slate-500 ml-2 italic">· {s.notes}</span>}
                  </div>
                  <span className="font-mono font-semibold text-purple-700 tabular-nums">
                    {formatDurationHuman(s.durationSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Tasks */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            To-Do Tasks ({relatedAssignments.length})
          </h3>
          {relatedAssignments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tasks linked to this skill.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {relatedAssignments.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.status === 'Completed' ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                    <span className={a.status === 'Completed' ? 'line-through text-slate-400' : 'font-medium text-slate-800'}>
                      {a.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Due {formatReadableDate(a.dueDate, { shortMonth: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <button
                onClick={() => onReopen(skill.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Skill</span>
              </button>
            ) : (
              <button
                onClick={() => onComplete(skill.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Completed</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(skill);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onDelete(skill.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onStartStudying(skill.id);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Studying</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
