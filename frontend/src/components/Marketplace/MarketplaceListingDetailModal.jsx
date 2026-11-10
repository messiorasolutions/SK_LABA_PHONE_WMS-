import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  DollarSign,
  Smartphone,
  Battery,
  Box,
  Zap,
  User,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Trash2,
  EyeOff,
  ShoppingBag,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

function resolvePhotoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const clean = trimmed.replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) {
    return `${base}/${clean}`;
  }
  return `${base}/uploads/${clean}`;
}

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-US');
}

export default function MarketplaceListingDetailModal({
  listing,
  onClose,
  onApprove,
  onReject,
  onRequestChanges,
  onUnpublish,
  onMarkSold,
  onDelete,
}) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [promptAction, setPromptAction] = useState(null); // 'reject' | 'changes' | 'sold' | 'delete'
  const [reasonInput, setReasonInput] = useState('');
  const [soldPriceInput, setSoldPriceInput] = useState(listing?.price || '');
  const [actionError, setActionError] = useState('');

  // Extract gallery photos safely before effects
  const photos = React.useMemo(() => {
    if (!listing) return [];
    let list = [];
    try {
      if (Array.isArray(listing.photos)) {
        list = [...listing.photos];
      } else if (typeof listing.photos === 'string') {
        const trimmed = listing.photos.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          list = JSON.parse(trimmed);
        } else if (trimmed) {
          list = [trimmed];
        }
      }
    } catch (e) {
      if (typeof listing.photos === 'string' && listing.photos.trim()) {
        list = [listing.photos.trim()];
      }
    }

    if (list.length === 0) {
      if (listing.main_photo) list.push(listing.main_photo);
      else if (listing.image_url) list.push(listing.image_url);
      else if (listing.photo) list.push(listing.photo);
    }
    return list;
  }, [listing]);

  // Keyboard navigation for Lightbox quality inspection
  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setSelectedPhotoIndex((i) => (i + 1) % photos.length);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setSelectedPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
        setZoomLevel(1);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(4, z + 0.5));
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(1, z - 0.5));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, photos.length]);

  if (!listing) return null;

  const askingPrice = Number(listing.price || 0);
  const commission = Math.round((askingPrice * 5) / 100);
  const sellerPayout = Math.max(0, askingPrice - commission);

  const handleExecutePrompt = async () => {
    setActionError('');
    if (promptAction === 'reject') {
      if (!reasonInput.trim()) {
        setActionError('Please enter a rejection reason for the seller.');
        return;
      }
      setActionLoading(true);
      try {
        await onReject(listing.listing_id, reasonInput.trim());
        onClose();
      } catch (err) {
        setActionError(err.response?.data?.message || err.message || 'Failed to reject listing');
      } finally {
        setActionLoading(false);
      }
    } else if (promptAction === 'changes') {
      if (!reasonInput.trim()) {
        setActionError('Please enter what changes are needed from the seller.');
        return;
      }
      setActionLoading(true);
      try {
        await onRequestChanges(listing.listing_id, reasonInput.trim());
        onClose();
      } catch (err) {
        setActionError(err.response?.data?.message || err.message || 'Failed to request changes');
      } finally {
        setActionLoading(false);
      }
    } else if (promptAction === 'sold') {
      setActionLoading(true);
      try {
        await onMarkSold(listing.listing_id, {
          sold_price: soldPriceInput ? Number(soldPriceInput) : askingPrice,
          admin_notes: reasonInput.trim() || 'Marked as SOLD by administrator',
        });
        onClose();
      } catch (err) {
        setActionError(err.response?.data?.message || err.message || 'Failed to mark listing as sold');
      } finally {
        setActionLoading(false);
      }
    } else if (promptAction === 'delete') {
      setActionLoading(true);
      try {
        await onDelete(listing.listing_id, reasonInput.trim() || 'Removed by administrator');
        onClose();
      } catch (err) {
        setActionError(err.response?.data?.message || err.message || 'Failed to remove listing');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDirectApprove = async () => {
    if (!window.confirm(`Are you sure you want to approve and publish "${listing.brand} ${listing.model}" to the Marketplace?`)) {
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await onApprove(listing.listing_id);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to approve listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectUnpublish = async () => {
    if (!window.confirm(`Are you sure you want to unpublish and hide "${listing.brand} ${listing.model}" from the public Marketplace?`)) {
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await onUnpublish(listing.listing_id);
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to unpublish listing');
    } finally {
      setActionLoading(false);
    }
  };

  const whatsappPhone = listing.seller_phone ? listing.seller_phone.replace(/\D/g, '') : '';
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `Hello ${listing.seller_name}, regarding your phone listing (${listing.listing_ref || 'Ref'}: ${listing.brand} ${listing.model}) on SK LABA PHONE:`
      )}`
    : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                {listing.listing_ref || `ID #${listing.listing_id}`}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  listing.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : listing.status === 'SOLD'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400'
                    : listing.status === 'PENDING_REVIEW' || listing.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                    : listing.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                    : listing.status === 'CHANGES_REQUESTED'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {listing.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {listing.brand} {listing.model}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Photo Gallery & Specs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Photos Column */}
            <div className="md:col-span-5 space-y-3">
              <div
                onClick={() => photos.length > 0 && setIsLightboxOpen(true)}
                className={`relative aspect-square w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-800 group ${
                  photos.length > 0 ? 'cursor-pointer hover:border-rose-500/50' : ''
                }`}
                title={photos.length > 0 ? "Click to enlarge photo" : ""}
              >
                {photos.length > 0 ? (
                  <img
                    src={resolvePhotoUrl(photos[selectedPhotoIndex])}
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Smartphone className="w-12 h-12 stroke-1" />
                    <span className="text-xs mt-2">No photos uploaded</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedPhotoIndex === idx
                          ? 'border-rose-600 scale-105 shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={resolvePhotoUrl(p)}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Financial Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Asking Listed Price:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(askingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Marketplace Fee (5%):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(commission)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Seller Payout:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(sellerPayout)}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Details & Seller Info Column */}
            <div className="md:col-span-7 space-y-5">
              {/* Device Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Storage</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {listing.storage}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Color</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {listing.color}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Condition</span>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {listing.condition_grade?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Battery Health</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {listing.battery_health ? `${listing.battery_health}%` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Box</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {listing.original_box ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Charger</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {listing.charger_included ? 'Included' : 'Not Included'}
                  </span>
                </div>
              </div>

              {/* Physical Condition Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Device Condition Report
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {listing.condition_description || 'No detailed condition comment provided.'}
                </p>
                {listing.display_condition && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <strong className="text-slate-700 dark:text-slate-200">Display:</strong> {listing.display_condition}
                  </div>
                )}
                {listing.camera_condition && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-200">Camera:</strong> {listing.camera_condition}
                  </div>
                )}
                {listing.biometrics_status && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-200">Biometrics:</strong> {listing.biometrics_status}
                  </div>
                )}
              </div>

              {/* Seller Contact Details */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                  <span>Seller Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {listing.seller_name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {listing.seller_phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate block">
                      {listing.seller_email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Submission Date</span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {whatsappUrl && (
                  <div className="pt-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contact Seller on WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Admin Notes / Rejection Reason if any */}
              {listing.rejection_reason && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                  <strong className="block mb-1">Rejection Reason:</strong>
                  {listing.rejection_reason}
                </div>
              )}
              {listing.changes_requested_reason && (
                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 text-xs text-sky-700 dark:text-sky-300">
                  <strong className="block mb-1">Requested Changes:</strong>
                  {listing.changes_requested_reason}
                </div>
              )}
            </div>
          </div>

          {/* Action Prompt Sub-Panel (Reject / Changes / Sold / Delete) */}
          {promptAction && (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {promptAction === 'sold'
                    ? 'Mark Listing as SOLD & Remove from Active Marketplace'
                    : promptAction === 'reject'
                    ? 'Reject Listing'
                    : promptAction === 'changes'
                    ? 'Request Changes from Seller'
                    : 'Remove / Delete Listing'}
                </h4>
                <button
                  type="button"
                  onClick={() => setPromptAction(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              {promptAction === 'sold' && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 dark:text-slate-300 block">
                    Final Selling Price (Rs.):
                  </label>
                  <input
                    type="number"
                    value={soldPriceInput}
                    onChange={(e) => setSoldPriceInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Marking this listing as SOLD will automatically archive the phone from the customer-facing
                    Marketplace and Smartphones catalogue so buyers can no longer purchase or reserve it.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-300 block">
                  {promptAction === 'sold'
                    ? 'Internal Admin Notes (Optional):'
                    : promptAction === 'delete'
                    ? 'Reason for Deleting / Removing (Optional):'
                    : 'Reason (Dispatched to Seller via Email):'}
                </label>
                <textarea
                  rows={2}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={
                    promptAction === 'sold'
                      ? 'e.g. Sold in-store to walking customer'
                      : promptAction === 'delete'
                      ? 'e.g. Seller requested cancellation'
                      : 'Provide clear instructions or reasons...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPromptAction(null)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePrompt}
                  disabled={actionLoading}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white ${
                    promptAction === 'sold'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : promptAction === 'delete' || promptAction === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {listing.status !== 'SOLD' && (
              <button
                type="button"
                onClick={() => setPromptAction('sold')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Mark this phone as sold and remove from active marketplace"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Mark as Sold & Remove</span>
              </button>
            )}

            {listing.status === 'PUBLISHED' && (
              <button
                type="button"
                onClick={handleDirectUnpublish}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPromptAction('delete')}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Listing</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {listing.status !== 'PUBLISHED' && listing.status !== 'SOLD' && (
              <>
                <button
                  type="button"
                  onClick={() => setPromptAction('changes')}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Request Changes
                </button>

                <button
                  type="button"
                  onClick={() => setPromptAction('reject')}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={handleDirectApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Publish Live</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen High-Resolution Quality Checking Lightbox */}
      {isLightboxOpen && photos.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
        >
          {/* Top Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/60 shrink-0 z-20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">
                {listing.brand} {listing.model}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                {selectedPhotoIndex + 1} / {photos.length}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {listing.storage} • {listing.condition_grade?.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-white px-2 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
                  disabled={zoomLevel >= 4}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {zoomLevel > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 cursor-pointer"
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <a
                href={resolvePhotoUrl(photos[selectedPhotoIndex])}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Open Original Photo in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                title="Close Inspector (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Large Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-auto p-4 cursor-zoom-in"
            onClick={() => {
              setZoomLevel((z) => (z === 1 ? 2 : 1));
            }}
          >
            <img
              src={resolvePhotoUrl(photos[selectedPhotoIndex])}
              alt={`Quality check ${selectedPhotoIndex + 1}`}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-out',
                maxWidth: zoomLevel === 1 ? '90vw' : 'none',
                maxHeight: zoomLevel === 1 ? '75vh' : 'none',
              }}
              className="object-contain drop-shadow-2xl rounded-lg"
            />

            {/* Prev / Next Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
                    setZoomLevel(1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-105"
                  title="Previous Photo (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex((i) => (i + 1) % photos.length);
                    setZoomLevel(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-xl hover:scale-105"
                  title="Next Photo (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="px-6 py-3 border-t border-white/10 bg-black/60 shrink-0 z-20 flex items-center justify-center gap-2 overflow-x-auto">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhotoIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedPhotoIndex === idx
                      ? 'border-rose-500 scale-105 shadow-md ring-2 ring-rose-500/40'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolvePhotoUrl(p)}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
