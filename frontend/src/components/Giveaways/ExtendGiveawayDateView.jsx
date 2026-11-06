import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gift,
  AlertCircle,
  CalendarPlus,
  Sparkles,
} from 'lucide-react';

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(val);
  }
}

export default function ExtendGiveawayDateView({
  giveaway,
  onBack,
  onExtend,
}) {
  const formatForInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [newEndDate, setNewEndDate] = useState(() => formatForInput(giveaway?.end_date));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!giveaway) return null;

  const handleQuickAddDays = (days) => {
    const base = new Date(giveaway.end_date || Date.now());
    const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setNewEndDate(formatForInput(target));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEndDate) {
      setError('Please select a valid new closing date and time.');
      return;
    }

    const currentEnd = new Date(giveaway.end_date).getTime();
    const chosenEnd = new Date(newEndDate).getTime();

    if (isNaN(chosenEnd)) {
      setError('Invalid date format.');
      return;
    }

    if (chosenEnd <= currentEnd) {
      setError('New closing date must be later than the current end date.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onExtend(giveaway.giveaway_id, new Date(newEndDate).toISOString());
      onBack();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to extend date.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header & Breadcrumb ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full transition-colors cursor-pointer"
            title="Back to Giveaways"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-normal text-slate-400">
              <span>Giveaway Management</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Extend Closing Date</span>
            </div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight mt-0.5">
              Extend Giveaway Closing Date
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Summary & Form Card ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Giveaway Info Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="text-xs font-normal text-slate-400 uppercase tracking-wider">
            Campaign Overview
          </div>

          <div className="flex items-start gap-3">
            {giveaway.thumbnail_url ? (
              <img
                src={giveaway.thumbnail_url}
                alt={giveaway.title}
                className="w-16 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-normal text-slate-900 dark:text-white truncate">
                {giveaway.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                {giveaway.short_description || 'No description available'}
              </p>
              <div className="mt-2 text-[11px] font-mono text-slate-400">
                SKLABA_Giveaway_{giveaway.giveaway_id}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Status:</span>
              <span className="font-normal text-slate-900 dark:text-slate-100">
                {giveaway.calculated_status || giveaway.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Start Date:</span>
              <span className="font-normal text-slate-700 dark:text-slate-300">
                {formatDate(giveaway.start_date)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Current End Date:</span>
              <span className="font-normal text-rose-600 dark:text-rose-400">
                {formatDate(giveaway.end_date)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Winner Selection:</span>
              <span className="font-normal text-slate-700 dark:text-slate-300">
                {formatDate(giveaway.winner_selection_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Date Selection & Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-5">
          <div>
            <h2 className="text-sm font-normal text-slate-900 dark:text-white">
              Choose New Closing Schedule
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extending the closing date updates the live countdown timer on the storefront in real-time, giving users more time to enter.
            </p>
          </div>

          {/* Quick Extension Buttons */}
          <div>
            <label className="block text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Quick Extension Shortcuts
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '+3 Days', days: 3 },
                { label: '+7 Days (1 Week)', days: 7 },
                { label: '+14 Days (2 Weeks)', days: 14 },
                { label: '+30 Days (1 Month)', days: 30 },
              ].map((shortcut) => (
                <button
                  key={shortcut.label}
                  type="button"
                  onClick={() => handleQuickAddDays(shortcut.days)}
                  className="px-3 py-1.5 text-xs font-normal border border-slate-200 dark:border-slate-700 rounded-full hover:border-neutral-400 dark:hover:border-neutral-500 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                New Giveaway End Date & Time *
              </label>
              <div className="relative max-w-md">
                <input
                  type="datetime-local"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must be later than current end date ({formatDate(giveaway.end_date)}).
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full shadow-sm border border-neutral-800 transition-all cursor-pointer disabled:opacity-60"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Extending...' : 'Confirm Extension'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

