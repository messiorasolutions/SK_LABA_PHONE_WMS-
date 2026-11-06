import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Gift,
  Calendar,
  Image as ImageIcon,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const TARGET_WIDTH = 1200;
        const TARGET_HEIGHT = 800;
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const dx = (TARGET_WIDTH - scaledWidth) / 2;
        const dy = (TARGET_HEIGHT - scaledHeight) / 2;

        ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = () => resolve('');
  });
};

export default function GiveawayFormView({
  initial = null,
  onBack,
  onSubmit,
  submitting = false,
}) {
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [winnerSelectionDate, setWinnerSelectionDate] = useState('');
  const [status, setStatus] = useState('DRAFT');

  const [descPreview, setDescPreview] = useState(false);
  const descRef = useRef(null);
  const [error, setError] = useState('');

  const formatForInput = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setShortDescription(initial.short_description || '');
      setDescription(initial.description || '');
      setThumbnailUrl(initial.thumbnail_url || '');
      setStartDate(formatForInput(initial.start_date));
      setEndDate(formatForInput(initial.end_date));
      setWinnerSelectionDate(formatForInput(initial.winner_selection_date));
      setStatus(initial.status || 'DRAFT');
    } else {
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const inEightDays = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

      setTitle('');
      setShortDescription('');
      setDescription('');
      setThumbnailUrl('');
      setStartDate(formatForInput(now));
      setEndDate(formatForInput(inSevenDays));
      setWinnerSelectionDate(formatForInput(inEightDays));
      setStatus('ONGOING');
    }
    setError('');
    setDescPreview(false);
  }, [initial]);

  const handleApplyFormat = (type) => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = description.substring(start, end);

    let inserted = '';
    let nextPos = start;

    if (type === 'bold') {
      inserted = selected ? `**${selected}**` : '**bold text**';
      nextPos = start + inserted.length;
    } else if (type === 'italic') {
      inserted = selected ? `*${selected}*` : '*italic text*';
      nextPos = start + inserted.length;
    } else if (type === 'underline') {
      inserted = selected ? `<u>${selected}</u>` : '<u>underlined text</u>';
      nextPos = start + inserted.length;
    } else if (type === 'bullet') {
      inserted = selected
        ? selected.split('\n').map((l) => (l.startsWith('• ') ? l : `• ${l}`)).join('\n')
        : '• Item 1\n• Item 2\n• Item 3';
      nextPos = start + inserted.length;
    } else if (type === 'numbered') {
      inserted = selected
        ? selected.split('\n').map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '')}`).join('\n')
        : '1. Step one\n2. Step two\n3. Step three';
      nextPos = start + inserted.length;
    }

    const updated = description.substring(0, start) + inserted + description.substring(end);
    setDescription(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setThumbnailUrl(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a giveaway title.');
      return;
    }
    if (!startDate) {
      setError('Please select a valid start date & time.');
      return;
    }
    if (!endDate) {
      setError('Please select a valid end date & time.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date & time must be later than the start date.');
      return;
    }
    if (!winnerSelectionDate) {
      setError('Please select a winner selection date & time.');
      return;
    }

    const payload = {
      title: title.trim(),
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      winner_selection_date: new Date(winnerSelectionDate).toISOString(),
      status: status || 'DRAFT',
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setError(res.error);
    }
  };

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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{initial ? 'Edit Giveaway' : 'Create New Giveaway'}</span>
              {status === 'DRAFT' && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Draft
                </span>
              )}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Configure giveaway title, formatted descriptions, prize banner, schedule dates, and live status
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Title, Short & Full Formatted Description */}
          <div className="lg:col-span-2 space-y-5">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Giveaway Information
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Giveaway Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Win a Brand New Samsung Galaxy S24 Ultra (512GB)!"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Description <span className="text-slate-400 font-normal">(Brief summary for cards & previews)</span>
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="e.g. Celebrate with SK Laba Phone! Enter our official promotional giveaway for your chance to win with free delivery."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 leading-relaxed"
                />
              </div>

              {/* Full Description with Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-normal text-slate-700 dark:text-slate-300">
                    Full Description & Entry Rules <span className="text-slate-400 font-normal">(Formatted)</span>
                  </label>

                  {/* Toolbar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('bold')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('italic')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('underline')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Underline (<u>text</u>)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('bullet')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Bullet list"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('numbered')}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Numbered list"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => setDescPreview(!descPreview)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-normal transition-colors ${
                        descPreview
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      title="Toggle Live Formatted Preview"
                    >
                      {descPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{descPreview ? 'Edit' : 'Preview'}</span>
                    </button>
                  </div>
                </div>

                {descPreview ? (
                  <div className="w-full min-h-[180px] p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed overflow-y-auto">
                    {description.trim() ? (
                      <FormattedDescription content={description} description={description} />
                    ) : (
                      <span className="text-slate-400 italic">No description written yet.</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    ref={descRef}
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed prize information, terms, and entry steps:&#10;&#10;• Step 1: Follow SK Laba Phone on Facebook and TikTok&#10;• Step 2: Like, share, and tag two friends on our official giveaway post&#10;• Step 3: Check your email on the winner announcement date"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 leading-relaxed font-mono text-[11.5px]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Timeline & Thumbnail Banner & Status */}
          <div className="space-y-5">
            {/* Thumbnail Banner */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Giveaway Banner / Thumbnail
              </div>

              <div className="aspect-video w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center relative">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Giveaway preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon className="w-8 h-8 stroke-1 mx-auto mb-1" />
                    <span className="text-[11px] font-normal">No photo chosen</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-neutral-400 dark:hover:border-neutral-500 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-normal text-slate-700 dark:text-slate-300">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Local Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
                />
              </div>
            </div>

            {/* Campaign Schedule & Status */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Schedule & Status
              </div>

              <div>
                <label className="block text-[11px] font-normal text-slate-600 dark:text-slate-400 mb-1">
                  Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-normal text-slate-600 dark:text-slate-400 mb-1">
                  Closing Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-normal text-slate-600 dark:text-slate-400 mb-1">
                  Winner Selection Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={winnerSelectionDate}
                  onChange={(e) => setWinnerSelectionDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-normal text-slate-600 dark:text-slate-400 mb-1">
                  Campaign Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="DRAFT">Save as Draft</option>
                  <option value="ONGOING">Ongoing (Active Campaign)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed Manually</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full shadow-sm border border-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : initial ? 'Update Giveaway' : 'Create Giveaway'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

