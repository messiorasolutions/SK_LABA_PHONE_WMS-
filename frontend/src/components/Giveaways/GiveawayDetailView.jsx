import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Gift,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Plus,
  Trash2,
  Send,
  CalendarPlus,
  Ban,
  Edit2,
  Trophy,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';

export default function GiveawayDetailView({
  giveaway,
  onBack,
  onEdit,
  onOpenExtendPage,
  onExtendEndDate,
  onManuallyClose,
  onPublishWinners,
}) {
  const [extendingDate, setExtendingDate] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  const [winners, setWinners] = useState([{ name: '', email: '' }]);
  const [publishingWinners, setPublishingWinners] = useState(false);
  const [winnerError, setWinnerError] = useState('');
  const [winnerSuccess, setWinnerSuccess] = useState('');
  const [isEditingWinners, setIsEditingWinners] = useState(false);

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
      if (Array.isArray(giveaway.winners) && giveaway.winners.length > 0) {
        setWinners(giveaway.winners.map((w) => ({ name: w.name || '', email: w.email || '' })));
      } else {
        setWinners([{ name: '', email: '' }]);
      }
      setWinnerError('');
      setWinnerSuccess('');
      setExtendingDate(false);
      setIsEditingWinners(false);
    }
  }, [giveaway]);

  if (!giveaway) return null;

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

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
        setWinnerSuccess(res.message || 'Winners published and congratulatory emails dispatched!');
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
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Giveaway Management</span>
        </button>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              {giveaway.title}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              SKLABA_Giveaway_{giveaway.giveaway_id} · Campaign Overview & Winner Announcements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onEdit(giveaway)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit This Giveaway</span>
          </button>
        </div>
      </div>

      {/* ── Banner Image if available ─────────────────────────────────── */}
      {giveaway.thumbnail_url && (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-72">
          <img
            src={giveaway.thumbnail_url}
            alt={giveaway.title}
            className="w-full h-72 object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* ── KPI Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </div>
            <div className="text-sm font-normal text-slate-900 dark:text-white mt-0.5">
              {status}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Closing Date
            </div>
            <div className="text-xs font-normal text-slate-800 dark:text-slate-200 mt-0.5">
              {formatDate(giveaway.end_date)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Selection Date
            </div>
            <div className="text-xs font-normal text-rose-600 dark:text-rose-400 mt-0.5">
              {formatDate(giveaway.winner_selection_date)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Winners Status
            </div>
            <div className="text-xs font-normal text-slate-900 dark:text-white mt-0.5">
              {giveaway.winners_announced
                ? `${giveaway.winners?.length || 0} Announced`
                : 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Details & Action Controls ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Countdown & Descriptions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Live Countdown Unit */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>{timeLeft.isEnded ? 'Giveaway Entry Has Ended' : 'Time Remaining to Close'}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Closes: {formatDate(giveaway.end_date)}
              </span>
            </div>

            {!timeLeft.isEnded && (
              <div className="grid grid-cols-5 gap-2 text-center font-mono pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="block text-lg font-normal text-slate-900 dark:text-white">
                    {String(timeLeft.months).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">Months</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="block text-lg font-normal text-slate-900 dark:text-white">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">Days</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="block text-lg font-normal text-slate-900 dark:text-white">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">Hours</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span className="block text-lg font-normal text-slate-900 dark:text-white">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase">Minutes</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
                  <span className="block text-lg font-normal text-rose-600 dark:text-rose-400">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-rose-500 uppercase">Seconds</span>
                </div>
              </div>
            )}
          </div>

          {/* Short Description */}
          {giveaway.short_description && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Short Description
              </div>
              <p className="text-xs font-normal text-slate-600 dark:text-slate-400 leading-relaxed">
                {giveaway.short_description}
              </p>
            </div>
          )}

          {/* Full Formatted Description & Rules */}
          {giveaway.description && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Full Description & Campaign Rules
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
                <FormattedDescription content={giveaway.description} description={giveaway.description} />
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Extend Date & Manual Close & Winner Announcement */}
        <div className="space-y-5">
          {/* Action Card: Extend Date & Manual Close */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Campaign Lifecycle Controls
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenExtendPage) {
                    onOpenExtendPage(giveaway);
                  } else {
                    setExtendingDate(!extendingDate);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-normal rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-slate-500" />
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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-normal rounded-full border border-rose-200/80 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>Manually Close Giveaway</span>
                </button>
              )}
            </div>

            {/* Inline Extend Date Form */}
            {extendingDate && (
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 space-y-2.5 animate-in fade-in">
                <span className="block text-xs font-normal text-slate-700 dark:text-slate-200">
                  New Closing Date & Time:
                </span>
                <input
                  type="datetime-local"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  disabled={extendLoading}
                  onClick={handleExtendSubmit}
                  className="w-full px-3 py-1.5 rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal cursor-pointer transition-all"
                >
                  {extendLoading ? 'Updating...' : 'Confirm Date Extension'}
                </button>
              </div>
            )}
          </div>

          {/* Winners Management Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <span>Giveaway Winners</span>
              </div>
              <span className="text-[11px] font-normal text-slate-400">
                {giveaway.winners_announced ? 'Published' : 'Pending'}
              </span>
            </div>

            {giveaway.winners_announced && Array.isArray(giveaway.winners) && giveaway.winners.length > 0 && !isEditingWinners ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-normal leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Winners have been officially published. Congratulatory notification emails with SK Laba Phone contact details were dispatched!
                  </span>
                </div>

                <div className="space-y-2">
                  {giveaway.winners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs font-normal"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-normal text-slate-900 dark:text-white">
                            {winner.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Winner #{idx + 1}
                          </span>
                        </div>
                        <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                          {winner.email}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {winner.announced_at ? new Date(winner.announced_at).toLocaleDateString() : 'Announced'}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setWinners(giveaway.winners.map((w) => ({ name: w.name || '', email: w.email || '' })));
                    setIsEditingWinners(true);
                  }}
                  className="w-full mt-2 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Winners / Manage Winners</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handlePublishWinnersSubmit} className="space-y-3">
                <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter winners&apos; names and emails below. You can add multiple winners using &quot;Add Another Winner&quot;. Upon publishing, automated congratulatory emails with store contact details will be dispatched immediately.
                </p>

                {winnerError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-normal">
                    {winnerError}
                  </div>
                )}
                {winnerSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-normal">
                    {winnerSuccess}
                  </div>
                )}

                <div className="space-y-2">
                  {winners.map((winner, idx) => (
                    <div key={idx} className="space-y-1.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between text-[11px] font-normal text-slate-400">
                        <span>Winner #{idx + 1}</span>
                        {winners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveWinnerRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove winner row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Winner Full Name"
                        value={winner.name}
                        onChange={(e) => handleWinnerChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Winner Email Address"
                        value={winner.email}
                        onChange={(e) => handleWinnerChange(idx, 'email', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddWinnerRow}
                    className="w-full py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Another Winner</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {giveaway.winners_announced && (
                      <button
                        type="button"
                        onClick={() => setIsEditingWinners(false)}
                        className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={publishingWinners}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{publishingWinners ? 'Publishing & Sending Emails...' : 'Publish Winners & Send Emails'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
