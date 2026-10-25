import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Skill } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  skillToEdit?: Skill | null;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  skillToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [targetCompletionDate, setTargetCompletionDate] = useState('');
  const [dailyStudyGoal, setDailyStudyGoal] = useState<number>(45);
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'Completed'>('In Progress');
  const [category, setCategory] = useState('Programming');
  const [error, setError] = useState('');

  useEffect(() => {
    if (skillToEdit) {
      setName(skillToEdit.name);
      setDescription(skillToEdit.description);
      setStartDate(skillToEdit.startDate);
      setTargetCompletionDate(skillToEdit.targetCompletionDate || '');
      setDailyStudyGoal(skillToEdit.dailyStudyGoal || 45);
      setProgress(skillToEdit.progress ?? 0);
      setNotes(skillToEdit.notes || '');
      setStatus(skillToEdit.status);
      setCategory(skillToEdit.category || 'General');
    } else {
      setName('');
      setDescription('');
      setStartDate(getTodayDateString());
      setTargetCompletionDate('');
      setDailyStudyGoal(45);
      setProgress(0);
      setNotes('');
      setStatus('In Progress');
      setCategory('Programming');
    }
    setError('');
  }, [skillToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a skill name.');
      return;
    }

    if (dailyStudyGoal <= 0) {
      setError('Daily goal must be at least 1 minute.');
      return;
    }

    const completedDate = status === 'Completed' ? (skillToEdit?.completedDate || getTodayDateString()) : undefined;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      startDate,
      targetCompletionDate: targetCompletionDate || undefined,
      dailyStudyGoal: Number(dailyStudyGoal),
      progress: Math.min(100, Math.max(0, Number(progress))),
      notes: notes.trim(),
      status,
      completedDate,
      category,
      color: '#8B5CF6',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skillToEdit ? 'Edit Skill' : 'Add New Skill'}
      description="Track learning progress, milestones, and daily study objectives."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Skill Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Python, Web Development, English..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="Key concepts, syllabus, or focus areas..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            >
              <option value="Programming">Programming</option>
              <option value="Language">Language</option>
              <option value="Web Dev">Web Development</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="General">Other / General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Daily Study Goal (Minutes) *
            </label>
            <input
              type="number"
              min="5"
              max="720"
              required
              value={dailyStudyGoal}
              onChange={e => setDailyStudyGoal(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Completion (Optional)
            </label>
            <input
              type="date"
              value={targetCompletionDate}
              onChange={e => setTargetCompletionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Progress Percentage
            </label>
            <span className="text-xs font-bold text-purple-700 font-mono tabular-nums">
              {progress}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={e => {
              const val = Number(e.target.value);
              setProgress(val);
              if (val === 100) {
                setStatus('Completed');
              } else if (status === 'Completed' && val < 100) {
                setStatus('In Progress');
              }
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus('In Progress');
                if (progress === 100) setProgress(90);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                status === 'In Progress'
                  ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('Completed');
                setProgress(100);
              }}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                status === 'Completed'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes & Resources
          </label>
          <textarea
            rows={2}
            placeholder="Links, textbooks, or learning goals..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm shadow-purple-200"
          >
            {skillToEdit ? 'Save Changes' : 'Create Skill'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
