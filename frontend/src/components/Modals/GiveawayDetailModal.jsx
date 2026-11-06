import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  Plus,
  Trash2,
  Send,
  CalendarPlus,
  Ban,
  Check,
  Store,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';

export default function GiveawayDetailModal({
  isOpen,
  onClose,
  giveaway,
  onExtendEndDate,
  onManuallyClose,
  onPublishWinners,
  onEdit,
}) {
  const [extendingDate, setExtendingDate] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  const [winners, setWinners] = useState([{ name: '', email: '' }]);
  const [publishingWinners, setPublishingWinners] = useState(false);
  const [winnerError, setWinnerError] = useState('');
  const [winnerSuccess, setWinnerSuccess] = useState('');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    if (!giveaway?.end_date) return;

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(giveaway.end_date).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const months = Math.floor(totalSeconds / (30 * 24 * 3600));
      const days = Math.floor((totalSeconds % (30 * 24 * 3600)) / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ months, days, hours, minutes, seconds, isEnded: false });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [giveaway?.end_date]);

  useEffect(() => {
    if (giveaway) {
      const d = new Date(giveaway.end_date);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        setNewEndDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
      setWinners([{ name: '', email: '' }]);
      setWinnerError('');
      setWinnerSuccess('');
      setExtendingDate(false);
    }
  }, [giveaway, isOpen]);

  if (!isOpen || !giveaway) return null;

  const handleAddWinnerRow = () => {
    setWinners((prev) => [...prev, { name: '', email: '' }]);
  };

  const handleRemoveWinnerRow = (index) => {
    if (winners.length <= 1) return;
    setWinners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWinnerChange = (index, field, value) => {
    setWinners((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    );
  };

  const handlePublishWinnersSubmit = async (e) => {
    e.preventDefault();
    setWinnerError('');
    setWinnerSuccess('');

    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < winners.length; i++) {
      const w = winners[i];
      if (!w.name.trim()) {
        setWinnerError(`Please enter a name for Winner #${i + 1}.`);
        return;
      }
      if (!w.email.trim() || !emailRegex.test(w.email.trim())) {
        setWinnerError(`Please enter a valid email for Winner #${i + 1} (${w.name}).`);
        return;
      }
    }

    setPublishingWinners(true);
    try {
      const res = await onPublishWinners(giveaway.giveaway_id, winners);
      if (res?.success) {
        setWinnerSuccess(res.message || 'Winners announced & congratulations emails sent!');
      } else {
        setWinnerError(res?.error || 'Failed to publish winners.');
      }
    } catch (err) {
      setWinnerError(err.message || 'Failed to publish winners.');
    } finally {
      setPublishingWinners(false);
    }
  };

  const handleExtendSubmit = async () => {
    if (!newEndDate) return;
    setExtendLoading(true);
    try {
      await onExtendEndDate(giveaway.giveaway_id, newEndDate);
      setExtendingDate(false);
    } finally {
      setExtendLoading(false);
    }
  };

  const status = giveaway.calculated_status || giveaway.status;
  const isOngoing = status === 'ONGOING';
  const isClosed = status === 'CLOSED';
  const isCompleted = status === 'COMPLETED';
  const isDraft = status === 'DRAFT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {giveaway.title}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isOngoing
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : isCompleted
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : isDraft
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Giveaway ID #{giveaway.giveaway_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-200">
          {/* Top Banner & Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {giveaway.thumbnail_url ? (
              <div className="aspect-video sm:aspect-4/3 w-full rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900 shadow-sm">
                <img
                  src={giveaway.thumbnail_url}
                  alt={giveaway.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video sm:aspect-4/3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Gift className="w-8 h-8 stroke-1" />
              </div>
            )}

            <div className="sm:col-span-2 space-y-3">
              {giveaway.short_description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {giveaway.short_description}
                </p>
              )}

              {/* Countdown Unit Bar */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{timeLeft.isEnded ? 'Giveaway Has Ended' : 'Time Remaining'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Closes: {new Date(giveaway.end_date).toLocaleDateString()}
                  </span>
                </div>

                {!timeLeft.isEnded && (
                  <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {timeLeft.months}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">mo</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {timeLeft.days}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">days</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {timeLeft.hours}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">hrs</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {timeLeft.minutes}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">min</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="block text-sm font-bold text-rose-600 dark:text-rose-400 leading-none">
                        {timeLeft.seconds}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase">sec</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExtendingDate(!extendingDate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Extend Closing Date</span>
                </button>

                {!isClosed && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to manually close this giveaway now?')) {
                        onManuallyClose(giveaway.giveaway_id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Manually Close</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(giveaway);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Edit Giveaway</span>
                </button>
              </div>

              {/* Inline Extend Date Form */}
              {extendingDate && (
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-2.5 animate-in fade-in">
                  <span className="block text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Set New Closing Date & Time:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      disabled={extendLoading}
                      onClick={handleExtendSubmit}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      {extendLoading ? 'Saving...' : 'Confirm Extension'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Start Date & Time
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {new Date(giveaway.start_date).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Closing Date & Time
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {new Date(giveaway.end_date).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Winner Selection Date
              </span>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                {new Date(giveaway.winner_selection_date).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Full Description & Rules */}
          {giveaway.description && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Giveaway Description & Entry Instructions:
              </span>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 leading-relaxed text-xs">
                <FormattedDescription description={giveaway.description} />
              </div>
            </div>
          )}

          {/* Winner Management Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Giveaway Winners Management
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  giveaway.winners_announced
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {giveaway.winners_announced ? 'Winners Announced' : 'Pending Selection'}
              </span>
            </div>

            {/* If winners already announced */}
            {giveaway.winners_announced && Array.isArray(giveaway.winners) && giveaway.winners.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Winners have been officially published. Congratulatory notification emails with SK Laba Phone contact details were dispatched to all recipients!
                  </span>
                </div>

                <div className="space-y-2">
                  {giveaway.winners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <span className="block font-semibold text-xs text-slate-900 dark:text-white">
                            {winner.name}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {winner.email}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {winner.announced_at ? new Date(winner.announced_at).toLocaleDateString() : 'Announced'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Publish Winners Form */
              <form onSubmit={handlePublishWinnersSubmit} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the winner&apos;s full name and email address below. When you click &quot;Publish Winners&quot;, the system will automatically dispatch congratulatory winner emails containing official SK Laba Phone contact details.
                </p>

                {winnerError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
                    {winnerError}
                  </div>
                )}
                {winnerSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs">
                    {winnerSuccess}
                  </div>
                )}

                <div className="space-y-2.5">
                  {winners.map((winner, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-[11px] font-bold text-slate-400 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Winner Name (e.g. John Doe)"
                        value={winner.name}
                        onChange={(e) => handleWinnerChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Winner Email (e.g. winner@gmail.com)"
                        value={winner.email}
                        onChange={(e) => handleWinnerChange(idx, 'email', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                      {winners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWinnerRow(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove Winner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleAddWinnerRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Winner</span>
                  </button>

                  <button
                    type="submit"
                    disabled={publishingWinners}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{publishingWinners ? 'Publishing & Sending Emails...' : 'Publish Winners & Send Emails'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

