import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Smartphone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  BatteryCharging,
  Image as ImageIcon,
  ExternalLink,
  MessageCircle,
  User,
  Sparkles,
  X,
} from 'lucide-react';
import { sellRequestService } from '../../services/sellRequestService';

function AuthenticatedPhoto({ requestId, photoPath, onZoom }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const filename = photoPath.split('/').pop().split('\\').pop();

    sellRequestService
      .getSellRequestPhotoBlob(requestId, filename)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [requestId, photoPath]);

  if (loading) {
    return (
      <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-pulse border border-slate-200 dark:border-slate-700">
        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700">
        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
        <span>Photo unavailable</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onZoom(blobUrl)}
      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-zoom-in"
    >
      <img
        src={blobUrl}
        alt="Customer Device Inspection"
        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-normal">
        Click to zoom
      </div>
    </div>
  );
}

function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    let str = String(dateInput).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    date = new Date(str);
  }
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SellRequestDetailView({
  request,
  onBack,
  editStatus,
  setEditStatus,
  editAssignedStaff,
  setEditAssignedStaff,
  staffList = [],
  onSave,
  saving = false,
  error = '',
  success = '',
}) {
  const [zoomUrl, setZoomUrl] = useState(null);
  const [quotePrice, setQuotePrice] = useState(
    request?.offered_price || request?.quote_amount || ''
  );

  if (!request) return null;

  const reqId = request.request_id || request.id;
  const photos = Array.isArray(request.photos)
    ? request.photos
    : typeof request.photos === 'string'
    ? JSON.parse(request.photos || '[]')
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sell & Trade-In Requests</span>
        </button>
        <span className="text-xs font-normal text-slate-400">
          Device Trade-in Assessment
        </span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Trade-in Request {reqId}: {request.brand_and_model}
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            From {request.customer_name} · Submitted on {formatDateTime(request.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Back to List
          </button>
          <button
            onClick={() => onSave({ quote_amount: quotePrice })}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? 'Saving...' : 'Save Assessment'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-normal text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Main Layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Device details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Customer Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Customer Name</span>
                <span className="text-sm font-normal text-slate-900 dark:text-white">
                  {request.customer_name}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Phone Number</span>
                <span className="font-mono text-xs font-normal text-slate-900 dark:text-white block mt-0.5">
                  {request.phone_number || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Email Address</span>
                <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                  {request.email || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Submission Date</span>
                <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                  {formatDateTime(request.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Device Appraisal Details Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Device Specifications & Condition
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Brand & Model</span>
                <span className="text-xs font-normal text-slate-900 dark:text-white">
                  {request.brand_and_model}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Storage</span>
                <span className="text-xs font-normal text-slate-900 dark:text-white">
                  {request.storage_capacity || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Condition</span>
                <span className="text-xs font-normal text-slate-900 dark:text-white">
                  {request.phone_condition || '—'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-normal text-slate-400 block">Battery Health</span>
                <span className="text-xs font-normal text-slate-900 dark:text-white">
                  {request.battery_health || '—'}
                </span>
              </div>
            </div>

            {request.accessories && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-normal text-slate-400 block mb-1">Included Accessories</span>
                <span className="text-xs font-normal text-slate-700 dark:text-slate-300">
                  {request.accessories}
                </span>
              </div>
            )}
          </div>

          {/* Inspection Photos Gallery */}
          {photos.length > 0 && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Customer Inspection Photos ({photos.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photoPath, idx) => (
                  <AuthenticatedPhoto
                    key={idx}
                    requestId={reqId}
                    photoPath={photoPath}
                    onZoom={(url) => setZoomUrl(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Desired Phone (Trade-in Target) */}
          {request.desired_phone && (
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Target Desired Phone (Trade-In Upgrade)
              </div>
              <div className="text-xs font-normal text-slate-800 dark:text-slate-200">
                {request.desired_phone.name || request.desired_phone.model}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Valuation & Status */}
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Appraisal Quote & Status
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Valuation / Quote Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="e.g. 280.00"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
              />
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Assessment Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Quote Given">Quote Given</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                Assign Staff Member
              </label>
              <select
                value={editAssignedStaff}
                onChange={(e) => setEditAssignedStaff(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {staffList.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.display_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onSave({ quote_amount: quotePrice })}
              disabled={saving}
              className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : 'Update Assessment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomUrl(null)}
        >
          <img src={zoomUrl} alt="Inspection Zoom" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}

