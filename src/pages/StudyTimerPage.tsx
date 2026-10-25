import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Check, 
  PlusCircle, 
  Clock, 
  Calendar, 
  FileText, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { 
  formatTimerDigital, 
  getTodayDateString, 
  formatCurrentTime, 
  formatDurationHuman, 
  formatReadableDate 
} from '../utils/dateUtils';
import { ActiveTimerState, StudySession } from '../types';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const StudyTimerPage: React.FC = () => {
  const { 
    skills, 
    sessions, 
    activeTimerState, 
    updateActiveTimerState, 
    addSession, 
    deleteSession, 
    preselectedSkillId,
    showNotification
  } = useApp();

  // Active tab: 'timer' (interactive stopwatch) or 'manual' (retroactive entry)
  const [activeTab, setActiveTab] = useState<'timer' | 'manual'>('timer');

  // Interactive Stopwatch States
  const [selectedSkillId, setSelectedSkillId] = useState<string>(() => {
    if (activeTimerState?.skillId) return activeTimerState.skillId;
    if (preselectedSkillId) return preselectedSkillId;
    return skills[0]?.id || '';
  });

  const [sessionNotes, setSessionNotes] = useState<string>(() => {
    return activeTimerState?.sessionNotes || '';
  });

  const [currentElapsedSeconds, setCurrentElapsedSeconds] = useState<number>(() => {
    if (!activeTimerState) return 0;
    if (activeTimerState.isRunning && activeTimerState.lastResumeTimestamp) {
      const additional = Math.floor((Date.now() - activeTimerState.lastResumeTimestamp) / 1000);
      return activeTimerState.accumulatedSeconds + Math.max(0, additional);
    }
    return activeTimerState.accumulatedSeconds || 0;
  });

  const [isSessionFinished, setIsSessionFinished] = useState<boolean>(false);
  const [finishedDuration, setFinishedDuration] = useState<number>(0);
  const [sessionEndTimeStr, setSessionEndTimeStr] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);

  // Manual Time Entry States
  const [manualSkillId, setManualSkillId] = useState<string>(() => skills[0]?.id || '');
  const [manualDate, setManualDate] = useState<string>(getTodayDateString());
  const [manualHours, setManualHours] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<number>(45);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualError, setManualError] = useState<string>('');

  const timerIntervalRef = useRef<number | null>(null);

  // Sync if preselectedSkillId changes from outside navigation
  useEffect(() => {
    if (preselectedSkillId && !activeTimerState?.isRunning) {
      setSelectedSkillId(preselectedSkillId);
    }
  }, [preselectedSkillId, activeTimerState]);

  // Handle timer tick
  useEffect(() => {
    if (activeTimerState?.isRunning && activeTimerState.lastResumeTimestamp) {
      timerIntervalRef.current = window.setInterval(() => {
        const additional = Math.floor((Date.now() - (activeTimerState.lastResumeTimestamp || Date.now())) / 1000);
        setCurrentElapsedSeconds(activeTimerState.accumulatedSeconds + Math.max(0, additional));
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimerState]);

  // Start / Resume Timer
  const handleStartResume = () => {
    if (!selectedSkillId) {
      showNotification('Please select a skill first.', 'warning');
      return;
    }

    const now = Date.now();
    const isFirstStart = !activeTimerState;
    const startTimeStr = isFirstStart ? formatCurrentTime(true) : activeTimerState.sessionStartTime;

    const nextState: ActiveTimerState = {
      skillId: selectedSkillId,
      accumulatedSeconds: currentElapsedSeconds,
      isRunning: true,
      lastResumeTimestamp: now,
      sessionStartTime: startTimeStr,
      sessionNotes: sessionNotes,
    };

    updateActiveTimerState(nextState);
  };

  // Pause Timer (paused time must NOT count toward study duration)
  const handlePause = () => {
    if (!activeTimerState?.isRunning || !activeTimerState.lastResumeTimestamp) return;

    const additional = Math.floor((Date.now() - activeTimerState.lastResumeTimestamp) / 1000);
    const totalAccumulated = activeTimerState.accumulatedSeconds + Math.max(0, additional);

    const nextState: ActiveTimerState = {
      ...activeTimerState,
      accumulatedSeconds: totalAccumulated,
      isRunning: false,
      lastResumeTimestamp: null,
      sessionNotes: sessionNotes,
    };

    setCurrentElapsedSeconds(totalAccumulated);
    updateActiveTimerState(nextState);
  };

  // Finish Session (Stop and prepare save)
  const handleFinish = () => {
    let finalSeconds = currentElapsedSeconds;
    if (activeTimerState?.isRunning && activeTimerState.lastResumeTimestamp) {
      const additional = Math.floor((Date.now() - activeTimerState.lastResumeTimestamp) / 1000);
      finalSeconds = activeTimerState.accumulatedSeconds + Math.max(0, additional);
    }

    if (finalSeconds < 5) {
      showNotification('Session duration was under 5 seconds. Ignored.', 'warning');
      handleCancelReset();
      return;
    }

    setFinishedDuration(finalSeconds);
    setSessionEndTimeStr(formatCurrentTime(true));
    setIsSessionFinished(true);

    // Stop the active timer state
    updateActiveTimerState(null);
  };

  // Cancel & Reset Session with confirmation
  const handleCancelReset = () => {
    updateActiveTimerState(null);
    setCurrentElapsedSeconds(0);
    setIsSessionFinished(false);
    setFinishedDuration(0);
    setSessionNotes('');
    setShowCancelConfirm(false);
  };

  // Save the finished session (prevents duplicate session saves)
  const handleSaveFinishedSession = () => {
    if (isSaving || finishedDuration <= 0) return;
    setIsSaving(true);

    const targetSkill = skills.find(s => s.id === selectedSkillId);
    const skillName = targetSkill ? targetSkill.name : 'General Study';
    const today = getTodayDateString();

    const newSession: Omit<StudySession, 'id' | 'createdAt'> = {
      skillId: selectedSkillId,
      skillName,
      date: today,
      durationSeconds: finishedDuration,
      startTime: activeTimerState?.sessionStartTime || formatCurrentTime(),
      endTime: sessionEndTimeStr || formatCurrentTime(),
      notes: sessionNotes.trim() || undefined,
    };

    addSession(newSession);

    // Confetti celebration for studying!
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // safe fallback
    }

    // Reset view
    setIsSaving(false);
    setIsSessionFinished(false);
    setFinishedDuration(0);
    setCurrentElapsedSeconds(0);
    setSessionNotes('');
  };

  // Manual Time Entry Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSkillId) {
      setManualError('Please choose a skill.');
      return;
    }

    const totalSeconds = (Number(manualHours) * 3600) + (Number(manualMinutes) * 60);
    if (totalSeconds <= 0) {
      setManualError('Study duration must be greater than zero.');
      return;
    }

    const targetSkill = skills.find(s => s.id === manualSkillId);
    const skillName = targetSkill ? targetSkill.name : 'General Study';

    addSession({
      skillId: manualSkillId,
      skillName,
      date: manualDate,
      durationSeconds: totalSeconds,
      startTime: 'Manual',
      endTime: 'Manual',
      notes: manualNotes.trim() || undefined,
    });

    // Reset manual form
    setManualNotes('');
    setManualHours(0);
    setManualMinutes(45);
    setManualError('');
    showNotification('Manual study session logged successfully!', 'success');
  };

  const isTimerRunning = activeTimerState?.isRunning || false;
  const isTimerPaused = !!activeTimerState && !activeTimerState.isRunning;
  const currentSkill = skills.find(s => s.id === selectedSkillId);

  return (
    <div className="space-y-6">
      {/* Top Segmented Mode Selector */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 bg-white border border-purple-100 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'timer'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Interactive Stopwatch</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Time Entry</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Stopwatch */}
      {activeTab === 'timer' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-md text-center relative overflow-hidden">
            {/* Subtle lavender background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-100/50 rounded-full blur-3xl pointer-events-none" />

            {/* Skill Selector (disabled while timer is running to maintain session integrity) */}
            <div className="max-w-md mx-auto mb-6 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
                Select Skill to Study
              </label>
              <select
                disabled={isTimerRunning || isTimerPaused || isSessionFinished}
                value={selectedSkillId}
                onChange={e => setSelectedSkillId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all text-center disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {skills.length === 0 ? (
                  <option value="">No skills yet - please create one first</option>
                ) : (
                  skills.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Big Digital Stopwatch Display */}
            <div className="py-8">
              <div className="inline-block px-8 py-5 bg-purple-50/80 border border-purple-200/80 rounded-3xl shadow-inner">
                <span className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
                  {formatTimerDigital(isSessionFinished ? finishedDuration : currentElapsedSeconds)}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {isSessionFinished ? (
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                    Session Finished · Ready to Save
                  </span>
                ) : isTimerRunning ? (
                  <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Studying now... (Paused time excluded)
                  </span>
                ) : isTimerPaused ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Timer Paused (Not counting)
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Ready to start · Daily Goal: {currentSkill?.dailyStudyGoal || 60}m
                  </span>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isSessionFinished && !isTimerRunning && !isTimerPaused && (
                <button
                  onClick={handleStartResume}
                  disabled={skills.length === 0}
                  className="flex items-center gap-2 px-8 py-3.5 text-base font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-2xl transition-all shadow-md shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Start Session</span>
                </button>
              )}

              {isTimerRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-2xl transition-colors shadow-xs"
                  >
                    <Pause className="w-4 h-4 fill-amber-800" />
                    <span>Pause</span>
                  </button>

                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-2xl transition-colors shadow-sm shadow-purple-200"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Finish Session</span>
                  </button>

                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                    title="Cancel and discard session"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              {isTimerPaused && !isSessionFinished && (
                <>
                  <button
                    onClick={handleStartResume}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-colors shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-2xl transition-colors shadow-sm shadow-purple-200"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Finish Session</span>
                  </button>

                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                    title="Cancel and discard session"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              {isSessionFinished && (
                <div className="space-y-4 w-full max-w-md mx-auto pt-2">
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl text-left space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Recorded Duration:</span>
                      <strong className="text-purple-700 font-mono text-sm">{formatDurationHuman(finishedDuration)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Skill:</span>
                      <strong className="text-slate-800">{currentSkill?.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Date:</span>
                      <strong className="text-slate-800">{formatReadableDate(getTodayDateString())}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSaveFinishedSession}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-7 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm shadow-purple-200 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Study Session'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Session Notes */}
            <div className="mt-8 pt-6 border-t border-purple-50 max-w-md mx-auto text-left">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Session Notes (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="What did you study during this block? e.g. Recursion, LeetCode 33..."
                value={sessionNotes}
                onChange={e => {
                  setSessionNotes(e.target.value);
                  if (activeTimerState) {
                    updateActiveTimerState({ ...activeTimerState, sessionNotes: e.target.value });
                  }
                }}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Manual Time Entry */}
      {activeTab === 'manual' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Manual Study Time Entry
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Forgot to start the stopwatch? Record your study sessions afterward to keep streaks and charts accurate.
              </p>
            </div>

            {manualError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Skill *
                </label>
                <select
                  value={manualSkillId}
                  onChange={e => setManualSkillId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                >
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Date *
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={manualHours}
                    onChange={e => setManualHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Minutes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="59"
                    value={manualMinutes}
                    onChange={e => setManualMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes / Topic Covered
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Read Chapters 1-3, solved 3 practice problems..."
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm shadow-purple-200"
              >
                Save Manual Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Study Sessions History Table */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Session History Log
            </h3>
            <p className="text-xs text-slate-500">
              All saved study records ({sessions.length} total)
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 italic">
            No study sessions recorded yet. Start the stopwatch above or log a manual session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Skill</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sessions.map(sess => (
                  <tr key={sess.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {formatReadableDate(sess.date, { shortMonth: true })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {sess.skillName}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700 tabular-nums">
                      {formatDurationHuman(sess.durationSeconds)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {sess.startTime === 'Manual' ? 'Manual Entry' : `${sess.startTime} - ${sess.endTime}`}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {sess.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSessionToDeleteId(sess.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Timer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Current Session?"
        message="Are you sure you want to stop and discard this ongoing session? Your elapsed study time will not be saved."
        confirmLabel="Discard Session"
        cancelLabel="Keep Going"
        isDestructive={true}
        onConfirm={handleCancelReset}
        onCancel={() => setShowCancelConfirm(false)}
      />

      {/* Delete Saved Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sessionToDeleteId}
        title="Delete Recorded Session"
        message="Are you sure you want to delete this study session from history? Your streaks and total study hours will adjust automatically."
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (sessionToDeleteId) {
            deleteSession(sessionToDeleteId);
            setSessionToDeleteId(null);
          }
        }}
        onCancel={() => setSessionToDeleteId(null)}
      />
    </div>
  );
};
