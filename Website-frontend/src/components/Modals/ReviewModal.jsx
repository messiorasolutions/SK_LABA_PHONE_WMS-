import React, { useState, useEffect } from 'react';
import { X, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

export default function ReviewModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = formData.customer_name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }
    if (cleanName.length > 150) {
      setError('Name cannot exceed 150 characters.');
      return;
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    const cleanComment = formData.comment.trim();
    if (!cleanComment || cleanComment.length < 3) {
      setError('Please enter your feedback (at least 3 characters).');
      return;
    }
    if (cleanComment.length > 2000) {
      setError('Review comment cannot exceed 2,000 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await reviewService.submitReview({
        customer_name: cleanName,
        rating: Number(formData.rating),
        comment: cleanComment,
      });

      const msg =
        res.message ||
        'Thank you for sharing your experience! Your review has been submitted successfully and will appear on our website after approval.';
      setSuccessMessage(msg);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setError('Too many reviews submitted from this IP. Please try again after 15 minutes.');
      } else {
        setError(err.message || 'Failed to submit review. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {success ? (
        <div className="relative w-full max-w-md bg-[#0b1329] border border-white/10 rounded-2xl shadow-2xl p-6 text-center z-10 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="py-2 space-y-2">
            <h3 className="text-base font-bold text-white">Review Submitted!</h3>
            <p className="text-xs text-emerald-300 font-medium px-2 leading-relaxed">
              &ldquo;{successMessage}&rdquo;
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-lg bg-[#0b1329] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Share Your Experience</h2>
              <p className="text-xs text-slate-400">Tell others about your experience with SK Laaba Phone</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Overall Rating <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || formData.rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, rating: star }))}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-semibold text-amber-400 ml-2">
                    {(hoverRating || formData.rating) === 5
                      ? 'Excellent (5/5)'
                      : (hoverRating || formData.rating) === 4
                      ? 'Very Good (4/5)'
                      : (hoverRating || formData.rating) === 3
                      ? 'Good (3/5)'
                      : (hoverRating || formData.rating) === 2
                      ? 'Fair (2/5)'
                      : 'Poor (1/5)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Kasun Perera"
                  value={formData.customer_name}
                  onChange={(e) => setFormData((p) => ({ ...p, customer_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Your Review / Feedback <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {formData.comment.length}/2000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="Tell us what you liked about our service, phone condition, delivery speed..."
                  value={formData.comment}
                  onChange={(e) => setFormData((p) => ({ ...p, comment: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
