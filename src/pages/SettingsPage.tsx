import React, { useState, useRef } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Sun, 
  Moon, 
  Target, 
  Database, 
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { exportAppData } from '../utils/storage';
import { getTodayDateString } from '../utils/dateUtils';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    loadDemoData, 
    clearDemoData, 
    clearAllData, 
    importJsonData,
    showNotification,
    skills,
    sessions,
    assignments
  } = useApp();

  const [dailyGoal, setDailyGoal] = useState<number>(settings.dailyStudyGoalMinutes || 60);
  const [streakTarget, setStreakTarget] = useState<number>(settings.streakGoal || 14);
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme || 'light');
  
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showClearDemoConfirm, setShowClearDemoConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      dailyStudyGoalMinutes: Number(dailyGoal),
      streakGoal: Number(streakTarget),
      theme,
    });
    showNotification('Study preferences saved!', 'success');
  };

  const handleExport = () => {
    try {
      const json = exportAppData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daybyday-backup-${getTodayDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Backup exported successfully!', 'success');
    } catch {
      showNotification('Export failed. Please try again.', 'warning');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importJsonData(content);
        if (result.success) {
          setImportStatus({ message: 'JSON backup successfully restored!' });
        } else {
          setImportStatus({ message: result.message, isError: true });
        }
      }
    };
    reader.onerror = () => {
      setImportStatus({ message: 'Could not read file.', isError: true });
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Study Goals & Theme Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-purple-100/70 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-purple-50">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Study Goals & Appearance
            </h2>
            <p className="text-xs text-slate-500">
              Configure daily expectations and theme appearance
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Daily Study Goal (Minutes)
              </label>
              <input
                type="number"
                min="10"
                max="720"
                value={dailyGoal}
                onChange={e => setDailyGoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used to evaluate missed days and daily targets.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Streak Goal (Days)
              </label>
              <input
                type="number"
                min="3"
                max="365"
                value={streakTarget}
                onChange={e => setStreakTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono tabular-nums"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your personal milestone goal for unbroken learning consistency.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  updateSettings({ theme: 'light' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Pastel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  updateSettings({ theme: 'dark' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Slate</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm shadow-purple-200"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Demo Data Management */}
      <div className="bg-white rounded-2xl p-6 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-purple-50">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Demo Data Tools
            </h2>
            <p className="text-xs text-slate-500">
              Quickly populate or reset sample skills, streaks, and sessions
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Demo data creates realistic learning skills (Python, Web Development, English, Algorithms), active streaks, study logs, and to-do tasks so you can explore all dashboard analytics instantly.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={loadDemoData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Load Demo Data</span>
          </button>

          <button
            onClick={() => setShowClearDemoConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <span>Clear Demo Data (Start Fresh)</span>
          </button>
        </div>
      </div>

      {/* 3. Data Backup, Export & Import */}
      <div className="bg-white rounded-2xl p-6 border border-purple-100/70 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-purple-50">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Data Backup & Migration
            </h2>
            <p className="text-xs text-slate-500">
              Export your study history as JSON or restore a previously saved backup
            </p>
          </div>
        </div>

        {importStatus && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            importStatus.isError
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {importStatus.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Export JSON Backup
            </h3>
            <p className="text-xs text-slate-500">
              Download all your {skills.length} skills, {sessions.length} study sessions, and {assignments.length} tasks to a secure JSON file.
            </p>
            <button
              onClick={handleExport}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Data as JSON</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Import JSON Backup
            </h3>
            <p className="text-xs text-slate-500">
              Upload a previously exported DayByDay backup file to restore records.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Import JSON File</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone: Wipe All Data */}
      <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-rose-900">
            Danger Zone
          </h2>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Irreversibly delete all skills, study records, timer state, and settings stored in this browser. Please export a backup first if you want to keep your data.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowClearAllConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Clear Demo Confirm Dialog */}
      <ConfirmDialog
        isOpen={showClearDemoConfirm}
        title="Clear Demo Data?"
        message="This will clear all current skills, sessions, and tasks to leave you with a completely clean workspace. Are you sure?"
        confirmLabel="Clear Demo Data"
        isDestructive={false}
        onConfirm={() => {
          clearDemoData();
          setShowClearDemoConfirm(false);
        }}
        onCancel={() => setShowClearDemoConfirm(false)}
      />

      {/* Clear All Confirm Dialog */}
      <ConfirmDialog
        isOpen={showClearAllConfirm}
        title="Wipe All Application Data?"
        message="This will permanently delete all skills, study history, assignments, scheduled sessions, and preferences from your browser localStorage. This action cannot be undone."
        confirmLabel="Permanently Wipe All Data"
        isDestructive={true}
        onConfirm={() => {
          clearAllData();
          setShowClearAllConfirm(false);
        }}
        onCancel={() => setShowClearAllConfirm(false)}
      />
    </div>
  );
};
