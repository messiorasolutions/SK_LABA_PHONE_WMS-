import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Calendar,
  Clock,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';
import { STORE_INFO } from '../../constants/siteConfig';

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

export default function GiveawayDetailModal({ giveaway, isOpen, onClose }) {
  const [timeLeft, setTimeLeft] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

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
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, [giveaway?.end_date]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !giveaway) return null;

  const status = giveaway.calculated_status || giveaway.status;
  const isOngoing = status === 'ONGOING';
  const hasWinners = Boolean(giveaway.winners_announced && Array.isArray(giveaway.winners) && giveaway.winners.length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {isOngoing ? 'Ongoing Giveaway' : status}
                </span>
                <span className="text-[10px] text-theme-textMuted font-mono">
                  SKLABA_Giveaway_{giveaway.giveaway_id}
                </span>
              </div>
              <h2 className="text-sm font-normal text-white line-clamp-1 mt-0.5">
                {giveaway.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-theme-border text-theme-textSecondary hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-theme-textSecondary">
          {/* Banner Image */}
          {giveaway.thumbnail_url && (
            <div className="relative aspect-video sm:aspect-21/9 w-full rounded-xl overflow-hidden border border-theme-border bg-theme-input shadow-xs">
              <img
                src={giveaway.thumbnail_url}
                alt={giveaway.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-normal">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Official Promotion</span>
                </span>
              </div>
            </div>
          )}

          {/* Title & Short Description */}
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-normal text-white tracking-tight leading-snug">
              {giveaway.title}
            </h1>
            {giveaway.short_description && (
              <p className="text-xs sm:text-sm text-theme-textSecondary leading-relaxed font-normal">
                {giveaway.short_description}
              </p>
            )}
          </div>

          {/* Countdown Timer Block (Months, Days, Hours, Minutes, Seconds) */}
          <div className="p-4 sm:p-5 rounded-xl border border-theme-border bg-theme-input space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-normal text-white uppercase tracking-wider">
                  {timeLeft.isEnded ? 'Giveaway Concluded' : 'Giveaway Ending Countdown'}
                </span>
              </div>
              <span className="text-[11px] text-theme-textMuted font-mono">
                Closes: {formatDate(giveaway.end_date)}
              </span>
            </div>

            {timeLeft.isEnded ? (
              <div className="p-3 rounded-lg bg-theme-surface border border-theme-border text-center text-theme-textMuted text-xs font-normal">
                This giveaway entry period has ended. Official winners are displayed below.
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 sm:gap-3 text-center font-mono">
                {/* Months */}
                <div className="p-2 sm:p-3 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="block text-lg sm:text-2xl font-medium text-white leading-tight">
                    {String(timeLeft.months).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-theme-textMuted uppercase tracking-wider mt-1 block">
                    Months
                  </span>
                </div>
                {/* Days */}
                <div className="p-2 sm:p-3 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="block text-lg sm:text-2xl font-medium text-white leading-tight">
                    {String(timeLeft.days).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-theme-textMuted uppercase tracking-wider mt-1 block">
                    Days
                  </span>
                </div>
                {/* Hours */}
                <div className="p-2 sm:p-3 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="block text-lg sm:text-2xl font-medium text-white leading-tight">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-theme-textMuted uppercase tracking-wider mt-1 block">
                    Hours
                  </span>
                </div>
                {/* Minutes */}
                <div className="p-2 sm:p-3 rounded-lg bg-theme-surface border border-theme-border">
                  <span className="block text-lg sm:text-2xl font-medium text-white leading-tight">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-theme-textMuted uppercase tracking-wider mt-1 block">
                    Mins
                  </span>
                </div>
                {/* Seconds */}
                <div className="p-2 sm:p-3 rounded-lg bg-theme-surface border border-rose-500/30">
                  <span className="block text-lg sm:text-2xl font-medium text-rose-400 leading-tight">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-rose-300 uppercase tracking-wider mt-1 block">
                    Secs
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-theme-border bg-theme-surface text-xs font-normal">
            <div>
              <span className="text-[10px] uppercase text-theme-textMuted block">
                Start Date
              </span>
              <span className="text-white mt-0.5 block font-mono">
                {formatDate(giveaway.start_date)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-theme-textMuted block">
                Closing Date
              </span>
              <span className="text-white mt-0.5 block font-mono">
                {formatDate(giveaway.end_date)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-theme-textMuted block">
                Winner Selection
              </span>
              <span className="text-rose-400 mt-0.5 block font-mono">
                {formatDate(giveaway.winner_selection_date)}
              </span>
            </div>
          </div>

          {/* Full Description & Rules */}
          {giveaway.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-normal uppercase tracking-wider text-white flex items-center gap-2">
                <span>Rules & Entry Instructions</span>
              </h3>
              <div className="p-4 sm:p-5 rounded-xl border border-theme-border bg-theme-input text-xs leading-relaxed text-theme-textSecondary font-normal">
                <FormattedDescription content={giveaway.description} isDark={true} />
              </div>
            </div>
          )}

          {/* Winner List Section */}
          <div className="p-4 sm:p-5 rounded-xl border border-theme-border bg-theme-input space-y-3.5">
            <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
              <div className="flex items-center gap-2 text-xs font-normal text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Official Winner Announcements</span>
              </div>
              <span className="text-[11px] font-normal text-theme-textMuted font-mono">
                {hasWinners ? `${giveaway.winners.length} Winner(s)` : 'Pending'}
              </span>
            </div>

            {hasWinners ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-normal flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Winners have been announced and officially notified via email. Please check your inbox or contact SK Laba Phone to arrange prize claim.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {giveaway.winners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-theme-border bg-theme-surface flex items-center gap-3 text-xs"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-normal text-white truncate">
                          {winner.name}
                        </span>
                        <span className="block text-[11px] text-theme-textMuted font-mono truncate mt-0.5">
                          {winner.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-theme-border bg-theme-surface text-center space-y-1.5">
                <Clock className="w-6 h-6 text-amber-400/80 mx-auto stroke-1" />
                <h4 className="text-xs font-normal text-white">Winner Selection Pending</h4>
                <p className="text-[11px] text-theme-textMuted leading-relaxed max-w-md mx-auto">
                  Winners will be selected and announced on <strong className="text-white font-normal">{formatDate(giveaway.winner_selection_date)}</strong>. Each lucky winner will automatically receive an official congratulatory confirmation email from SK Laba Phone.
                </p>
              </div>
            )}
          </div>

          {/* Store Contact & Prize Claim Details */}
          <div className="p-4 sm:p-5 rounded-xl border border-theme-border bg-theme-surface space-y-3">
            <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
              <span className="text-xs font-normal uppercase tracking-wider text-white">
                Contact & Store Information
              </span>
              <span className="text-[11px] text-theme-textMuted">Official Inquiries</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-normal text-theme-textSecondary">
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  Hotline:{' '}
                  <a href={`tel:${STORE_INFO.phone}`} className="text-white hover:underline">
                    {STORE_INFO.phone}
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  WhatsApp:{' '}
                  <a
                    href={`https://wa.me/${String(STORE_INFO.whatsapp).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:underline"
                  >
                    {STORE_INFO.whatsapp}
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  Email:{' '}
                  <a href={`mailto:${STORE_INFO.email}`} className="text-white hover:underline">
                    {STORE_INFO.email}
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{STORE_INFO.address}</span>
              </div>
            </div>

            <p className="text-[11px] text-theme-textMuted pt-1 border-t border-theme-border/60">
              Store Hours: {STORE_INFO.openingHours}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-theme-border bg-theme-surface flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-theme-border bg-transparent hover:bg-white/[0.04] text-white text-xs font-normal transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
