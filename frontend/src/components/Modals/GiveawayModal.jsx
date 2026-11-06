import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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

export default function GiveawayModal({
  isOpen,
  onClose,
  onSubmit,
  initial = null,
  loading = false,
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

  // Format date to YYYY-MM-DDTHH:mm for datetime-local input
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
  }, [initial, isOpen]);

  if (!isOpen) return null;

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

  const handleSave = async (submitStatus = status) => {
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
      setError('End date & time must be after the start date.');
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
      status: submitStatus,
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{initial ? 'Edit Giveaway' : 'Create New Giveaway'}</span>
                {status === 'DRAFT' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                    Draft
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure giveaway parameters, prize details, schedule, and thumbnail.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-200">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Giveaway Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Win a Brand New Samsung Galaxy S24 Ultra!"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* 2. Short Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Short Description <span className="text-slate-400 font-normal">(Brief summary for cards & previews)</span>
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Celebrate with SK Laba Phone! Enter for a chance to win the latest flagship device with free delivery."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* 3. Thumbnail Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Giveaway Thumbnail Image
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              {/* Preview Box */}
              <div className="aspect-video sm:aspect-4/3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center relative group">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Giveaway preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4 text-center">
                    <ImageIcon className="w-8 h-8 stroke-1 mb-1.5" />
                    <span className="text-[11px]">No image selected</span>
                  </div>
                )}
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="absolute top-2 right-2 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Upload className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Upload Local Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Or enter direct image URL (https://...)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Schedule & Dates */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Giveaway Timeline & Schedule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date & Time <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date & Time <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Winner Selection Date <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={winnerSelectionDate}
                  onChange={(e) => setWinnerSelectionDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* 5. Full Description with Rich Formatting Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Full Description & Rules <span className="text-slate-400 font-normal">(Supports rich formatting)</span>
              </label>

              {/* Toolbar & Preview toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyFormat('bold')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Bold (**text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFormat('italic')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Italic (*text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFormat('underline')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Underline (<u>text</u>)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => handleApplyFormat('bullet')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Bullet list"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFormat('numbered')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Numbered list"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setDescPreview(!descPreview)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    descPreview
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Toggle Live Formatted Preview"
                >
                  {descPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{descPreview ? 'Edit' : 'Preview'}</span>
                </button>
              </div>
            </div>

            {descPreview ? (
              <div className="w-full min-h-[160px] p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs overflow-y-auto">
                {description.trim() ? (
                  <FormattedDescription description={description} />
                ) : (
                  <span className="text-slate-400 italic">No description written yet.</span>
                )}
              </div>
            ) : (
              <textarea
                ref={descRef}
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed giveaway description, eligible terms, prize specifications, and entry requirements...&#10;&#10;• Step 1: Follow SK Laba Phone on Facebook & TikTok&#10;• Step 2: Like & Share this post&#10;• Step 3: Winners will be contacted directly via email"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed font-mono text-[11.5px]"
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="DRAFT">Save as Draft</option>
              <option value="ONGOING">Ongoing (Active)</option>
              <option value="COMPLETED">Completed</option>
              <option value="CLOSED">Closed Manually</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave(status)}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold transition-all shadow-md hover:shadow-rose-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : initial ? 'Update Giveaway' : 'Save Giveaway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

