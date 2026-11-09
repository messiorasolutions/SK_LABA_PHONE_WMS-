import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Trophy,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Home,
  RefreshCw,
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { getGiveaways } from '../services/giveawayService';
import FormattedDescription from '../components/Common/FormattedDescription';
import { useShopInfo } from '../context/ShopInfoContext';

// Clean countdown timer for giveaway cards and full-page views
function CountdownDisplay({ endDate, isLarge = false }) {
  const [timeLeft, setTimeLeft] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
  });

  useEffect(() => {
    if (!endDate) return;

    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
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

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.isEnded) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-theme-input border border-theme-border text-theme-textMuted text-xs font-mono">
        <Clock className="w-3.5 h-3.5" />
        <span>Entry Closed</span>
      </div>
    );
  }

  const boxClasses = isLarge
    ? 'p-2.5 sm:p-3 rounded-lg bg-theme-input border border-theme-border text-center'
    : 'p-2 sm:p-2.5 rounded-lg bg-theme-input border border-theme-border text-center';

  const numClasses = isLarge
    ? 'block text-lg sm:text-2xl font-medium font-mono text-white leading-tight'
    : 'block text-base sm:text-xl font-medium font-mono text-white leading-tight';

  return (
    <div className={`grid grid-cols-5 gap-1.5 sm:gap-2 font-mono ${isLarge ? 'max-w-md' : 'max-w-sm'}`}>
      <div className={boxClasses}>
        <span className={numClasses}>
          {String(timeLeft.months).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-theme-textMuted uppercase tracking-wider block mt-0.5">
          Mo
        </span>
      </div>
      <div className={boxClasses}>
        <span className={numClasses}>
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-theme-textMuted uppercase tracking-wider block mt-0.5">
          Days
        </span>
      </div>
      <div className={boxClasses}>
        <span className={numClasses}>
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-theme-textMuted uppercase tracking-wider block mt-0.5">
          Hrs
        </span>
      </div>
      <div className={boxClasses}>
        <span className={numClasses}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-theme-textMuted uppercase tracking-wider block mt-0.5">
          Mins
        </span>
      </div>
      <div className={`${boxClasses} border-rose-500/30`}>
        <span className={isLarge ? 'block text-lg sm:text-2xl font-medium font-mono text-rose-400 leading-tight' : 'block text-base sm:text-xl font-medium font-mono text-rose-400 leading-tight'}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[9px] text-rose-300 uppercase tracking-wider block mt-0.5">
          Secs
        </span>
      </div>
    </div>
  );
}

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(val);
  }
}

function formatDateTime(val) {
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

export default function GiveawaysPage({ onNavigateToHome }) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ONGOING, COMPLETED
  const [selectedGiveaway, setSelectedGiveaway] = useState(null);

  const fetchGiveaways = () => {
    setLoading(true);
    getGiveaways()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setGiveaways(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load giveaways:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGiveaways();
  }, []);

  // Filter out DRAFT giveaways from customer view
  const publicGiveaways = useMemo(() => {
    return giveaways.filter((g) => g.status !== 'DRAFT');
  }, [giveaways]);

  // Primary active ongoing giveaway for featured top banner
  const ongoingGiveaway = useMemo(() => {
    return publicGiveaways.find(
      (g) => (g.calculated_status || g.status) === 'ONGOING'
    ) || publicGiveaways[0];
  }, [publicGiveaways]);

  // Filtered list based on selected filter tab
  const filteredGiveaways = useMemo(() => {
    if (filterTab === 'ONGOING') {
      return publicGiveaways.filter((g) => (g.calculated_status || g.status) === 'ONGOING');
    }
    if (filterTab === 'COMPLETED') {
      return publicGiveaways.filter((g) => {
        const s = g.calculated_status || g.status;
        return s === 'COMPLETED' || s === 'CLOSED';
      });
    }
    return publicGiveaways;
  }, [publicGiveaways, filterTab]);

  const ongoingCount = useMemo(() => {
    return publicGiveaways.filter((g) => (g.calculated_status || g.status) === 'ONGOING').length;
  }, [publicGiveaways]);

  const completedCount = useMemo(() => {
    return publicGiveaways.filter((g) => {
      const s = g.calculated_status || g.status;
      return s === 'COMPLETED' || s === 'CLOSED';
    }).length;
  }, [publicGiveaways]);

  const handleGoHome = (e) => {
    e.preventDefault();
    if (onNavigateToHome) {
      onNavigateToHome();
    } else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // ── 1. FULL PAGE VIEW: GIVEAWAY DETAILS & RULES ───────────────────────
  // ═════════════════════════════════════════════════════════════════════
  if (selectedGiveaway) {
    const status = selectedGiveaway.calculated_status || selectedGiveaway.status;
    const isOngoing = status === 'ONGOING';
    const hasWinners = Boolean(
      selectedGiveaway.winners_announced &&
      Array.isArray(selectedGiveaway.winners) &&
      selectedGiveaway.winners.length > 0
    );

    return (
      <div className="relative w-full bg-theme-bg min-h-screen py-8 sm:py-12 text-theme-textPrimary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-theme-textMuted">
            <button
              type="button"
              onClick={handleGoHome}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Home className="w-3.5 h-3.5 text-theme-textSecondary" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-theme-borderLight" />
            <button
              type="button"
              onClick={() => {
                setSelectedGiveaway(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Official Giveaways
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-theme-borderLight" />
            <span className="text-theme-accentLight font-medium truncate max-w-xs sm:max-w-md">
              {selectedGiveaway.title}
            </span>
          </div>

          {/* Back button header */}
          <div className="flex items-center justify-between pb-4 border-b border-theme-border/60">
            <button
              type="button"
              onClick={() => {
                setSelectedGiveaway(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-theme-border bg-theme-surface hover:bg-white/[0.04] text-xs font-normal text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Giveaways</span>
            </button>
          </div>

          {/* Main Full Page Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Title, Countdown, Descriptions & Winner Announcement */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-normal uppercase tracking-wider ${
                      isOngoing
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        : 'bg-white/10 border border-white/20 text-white'
                    }`}
                  >
                    {isOngoing ? 'Ongoing Giveaway' : status}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight leading-snug">
                  {selectedGiveaway.title}
                </h1>

                {selectedGiveaway.short_description && (
                  <p className="text-xs sm:text-sm text-theme-textSecondary leading-relaxed font-normal">
                    {selectedGiveaway.short_description}
                  </p>
                )}
              </div>

              {/* Countdown Timer Block */}
              <div className="p-5 rounded-xl border border-theme-border bg-theme-surface space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-normal text-white uppercase tracking-wider">
                      Giveaway Ending Countdown
                    </span>
                  </div>
                  <span className="text-xs text-theme-textMuted font-mono">
                    Closes: {formatDate(selectedGiveaway.end_date)}
                  </span>
                </div>

                <CountdownDisplay endDate={selectedGiveaway.end_date} isLarge={true} />
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-theme-border bg-theme-surface text-xs font-normal">
                <div>
                  <span className="text-[10px] uppercase text-theme-textMuted block">
                    Start Date
                  </span>
                  <span className="text-white mt-1 block font-mono">
                    {formatDateTime(selectedGiveaway.start_date)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-theme-textMuted block">
                    Closing Date
                  </span>
                  <span className="text-white mt-1 block font-mono">
                    {formatDateTime(selectedGiveaway.end_date)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-theme-textMuted block">
                    Winner Selection
                  </span>
                  <span className="text-white mt-1 block font-mono">
                    {formatDateTime(selectedGiveaway.winner_selection_date)}
                  </span>
                </div>
              </div>

              {/* Full Description & Rules */}
              {selectedGiveaway.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-normal uppercase tracking-wider text-white">
                    Rules & Entry Instructions
                  </h3>
                  <div className="p-5 rounded-xl border border-theme-border bg-theme-surface text-xs leading-relaxed text-theme-textSecondary font-normal">
                    <FormattedDescription content={selectedGiveaway.description} isDark={true} />
                  </div>
                </div>
              )}

              {/* Store Contact Card (Moved down to where Winner Section was) */}
              <div className="p-5 rounded-xl border border-theme-border bg-theme-surface space-y-4">
                <div className="border-b border-theme-border pb-3">
                  <span className="text-xs font-normal uppercase tracking-wider text-white block">
                    Contact & Store Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-normal text-theme-textSecondary">
                  <div>
                    Hotline:{' '}
                    <a href={`tel:${shopInfo.phone}`} className="text-white hover:underline">
                      {shopInfo.phone}
                    </a>
                  </div>

                  <div>
                    WhatsApp:{' '}
                    <a
                      href={getWhatsAppUrl(`Hello SK LABA PHONE! I have a question about the ${selectedGiveaway.title}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white hover:underline"
                    >
                      {shopInfo.whatsapp}
                    </a>
                  </div>

                  <div>
                    Email:{' '}
                    <a href={`mailto:${shopInfo.email}`} className="text-white hover:underline">
                      {shopInfo.email}
                    </a>
                  </div>

                  <div>
                    {shopInfo.address}
                  </div>
                </div>

                <div className="pt-3 border-t border-theme-border/60 text-[11px] text-theme-textMuted">
                  Store Hours: {shopInfo.openingHours}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Banner Image & Winner Announcements */}
            <div className="lg:col-span-5 space-y-6">
              {/* Banner Image */}
              {selectedGiveaway.thumbnail_url && (
                <div className="rounded-xl overflow-hidden border border-theme-border bg-theme-input shadow-xs aspect-16/10">
                  <img
                    src={selectedGiveaway.thumbnail_url}
                    alt={selectedGiveaway.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}

              {/* Winner Announcements Section (Moved to right column where Contact Details was) */}
              <div className="p-5 rounded-xl border border-theme-border bg-theme-surface space-y-3.5">
                <div className="flex items-center justify-between border-b border-theme-border pb-3">
                  <div className="text-xs font-normal text-white">
                    <span>Winner Announcements</span>
                  </div>
                  <span className="text-xs font-normal text-white font-mono">
                    {hasWinners ? `${selectedGiveaway.winners.length} Winner(s)` : 'Pending'}
                  </span>
                </div>

                {hasWinners ? (
                  <div className="pt-1">
                    <div className="space-y-2">
                      {selectedGiveaway.winners.map((winner, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-theme-border bg-theme-input flex items-center justify-between text-xs"
                        >
                          <span className="font-normal text-white truncate">
                            {winner.name}
                          </span>
                          {selectedGiveaway.winners.length > 1 && (
                            <span className="text-[10px] text-theme-textMuted font-mono">
                              Winner #{idx + 1}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg border border-theme-border bg-theme-input text-center space-y-2">
                    <Clock className="w-6 h-6 text-white/70 mx-auto stroke-1" />
                    <h4 className="text-xs font-normal text-white">Winner Selection Pending</h4>
                    <p className="text-[11px] text-theme-textMuted leading-relaxed max-w-md mx-auto">
                      Winners will be selected and announced on <strong className="text-white font-normal">{formatDateTime(selectedGiveaway.winner_selection_date)}</strong>. Each lucky winner will automatically receive an official congratulatory confirmation email from SK Laba Phone.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // ── 2. MAIN CATALOG LIST VIEW ─────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="relative w-full bg-theme-bg min-h-screen py-8 sm:py-12 text-theme-textPrimary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Breadcrumb Navigation ──────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-theme-textMuted mb-6">
          <button
            type="button"
            onClick={handleGoHome}
            className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Home className="w-3.5 h-3.5 text-theme-textSecondary" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-theme-borderLight" />
          <span className="text-theme-accentLight font-semibold">Official Giveaways</span>
        </div>

        {/* ── Section Header (No left icon, clean text) ─────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-theme-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-normal text-white">
              Official Giveaways & Prize Draws
            </h1>
            <p className="text-xs text-theme-textSecondary mt-1 max-w-2xl">
              Enter official promotional giveaways hosted by SK Laba Phone for a chance to win authentic flagship smartphones and accessories direct from South Korea.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white/10 border-white/20 text-white shadow-xs'
                  : 'bg-transparent border-theme-border text-theme-textSecondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All Events ({publicGiveaways.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('ONGOING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                filterTab === 'ONGOING'
                  ? 'bg-rose-600/20 border-rose-500/40 text-rose-300 shadow-xs'
                  : 'bg-transparent border-theme-border text-theme-textSecondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Ongoing Active ({ongoingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                filterTab === 'COMPLETED'
                  ? 'bg-white/10 border-white/20 text-white shadow-xs'
                  : 'bg-transparent border-theme-border text-theme-textSecondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* ── Content Area ───────────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs text-theme-textMuted font-normal">Loading giveaways...</p>
          </div>
        ) : publicGiveaways.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-theme-border bg-theme-surface max-w-xl mx-auto p-8 space-y-3">
            <h3 className="text-sm font-normal text-white">No Active Giveaways At This Moment</h3>
            <p className="text-xs text-theme-textSecondary leading-relaxed">
              We frequently organize special giveaways for our customers. Follow our shop announcements to participate in the next giveaway!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* A. FEATURED ONGOING GIVEAWAY HERO */}
            {filterTab !== 'COMPLETED' && ongoingGiveaway && (
              <div className="rounded-2xl border border-theme-border hover:border-theme-borderMedium bg-theme-surface p-6 sm:p-8 transition-all shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Details & Live Countdown */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-normal text-white tracking-tight leading-snug">
                        {ongoingGiveaway.title}
                      </h2>
                      {ongoingGiveaway.short_description && (
                        <p className="text-xs sm:text-sm text-theme-textSecondary leading-relaxed font-normal max-w-xl">
                          {ongoingGiveaway.short_description}
                        </p>
                      )}
                    </div>

                    {/* Ending Countdown */}
                    <div className="space-y-1.5 pt-1">
                      <span className="block text-[11px] font-normal text-theme-textMuted uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Closing Countdown</span>
                      </span>
                      <CountdownDisplay endDate={ongoingGiveaway.end_date} />
                    </div>

                    {/* Winner Status Summary (White color for announced) */}
                    <div className="flex items-center gap-3 pt-1 text-xs">
                      <span className="text-theme-textMuted">Winners:</span>
                      {ongoingGiveaway.winners_announced ? (
                        <span className="inline-flex items-center gap-1.5 text-white font-normal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{ongoingGiveaway.winners?.length || 0} Winners Announced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-300 font-normal px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                          <span>Pending Selection ⏳</span>
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGiveaway(ongoingGiveaway);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal border border-neutral-800 transition-all cursor-pointer shadow-sm"
                      >
                        <span>View Details & Rules</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Hero Banner Image (Clean without text overlay) */}
                  <div className="lg:col-span-5">
                    <div
                      onClick={() => {
                        setSelectedGiveaway(ongoingGiveaway);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group relative aspect-16/10 w-full rounded-xl overflow-hidden border border-theme-border bg-theme-input cursor-pointer hover:border-theme-borderLight transition-all"
                    >
                      {ongoingGiveaway.thumbnail_url ? (
                        <img
                          src={ongoingGiveaway.thumbnail_url}
                          alt={ongoingGiveaway.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-theme-textMuted">
                          <span className="text-xs">No image available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. GIVEAWAY LIST (Renamed from Giveaway Archive) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-3">
                <h2 className="text-sm font-normal text-white uppercase tracking-wider">
                  Giveaway List ({filteredGiveaways.length})
                </h2>
                <span className="text-xs text-theme-textMuted font-mono">
                  Showing {filteredGiveaways.length} event{filteredGiveaways.length === 1 ? '' : 's'}
                </span>
              </div>

              {filteredGiveaways.length === 0 ? (
                <div className="py-12 text-center text-xs text-theme-textMuted border border-dashed border-theme-border rounded-xl">
                  No giveaways match the selected filter tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredGiveaways.map((item) => {
                    const status = item.calculated_status || item.status;
                    const isOngoing = status === 'ONGOING';
                    const isCompleted = status === 'COMPLETED';

                    return (
                      <div
                        key={item.giveaway_id}
                        onClick={() => {
                          setSelectedGiveaway(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group flex flex-col justify-between rounded-xl border border-theme-border hover:border-theme-borderLight bg-theme-surface hover:bg-theme-hover overflow-hidden transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video w-full bg-theme-input overflow-hidden border-b border-theme-border">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-theme-textMuted">
                              <span className="text-xs">No image</span>
                            </div>
                          )}

                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-normal uppercase tracking-wider ${
                                isOngoing
                                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                  : 'bg-white/10 border border-white/20 text-white'
                              }`}
                            >
                              {isOngoing ? 'Ongoing' : status}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-xs sm:text-sm font-normal text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-theme-textSecondary line-clamp-2 leading-relaxed font-normal">
                              {item.short_description || 'Click to view giveaway instructions and prize details.'}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-theme-border space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between text-theme-textMuted font-normal">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-theme-textMuted" />
                                <span>Closing Date:</span>
                              </span>
                              <span className="font-mono text-theme-textSecondary">
                                {formatDate(item.end_date)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-theme-textMuted">Winners:</span>
                              {item.winners_announced && Array.isArray(item.winners) && item.winners.length > 0 ? (
                                <span className="font-normal text-white flex items-center gap-1">
                                  <Trophy className="w-3 h-3 text-white" />
                                  <span>{item.winners.length} Announced</span>
                                </span>
                              ) : (
                                <span className="text-amber-300 font-normal italic">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              className="w-full py-2 px-3 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] text-theme-textSecondary group-hover:text-white text-xs font-normal border border-theme-border flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>View Details</span>
                              <ChevronRight className="w-3.5 h-3.5 text-theme-textMuted group-hover:text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
