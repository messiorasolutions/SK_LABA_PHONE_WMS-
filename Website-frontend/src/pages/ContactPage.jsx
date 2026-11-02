import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { STORE_INFO } from '../constants/siteConfig';
import { createInquiry } from '../services/inquiryService';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleQuickTopic = (topicText) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message ? `${prev.message}\n${topicText}` : topicText,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation matching backend inquiryValidation.js & API Documentation
    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }
    if (trimmedName.length > 150) {
      setError('Name cannot exceed 150 characters.');
      return;
    }

    const digitsOnly = formData.phone_number.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number containing 7 to 15 digits.');
      return;
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage || trimmedMessage.length < 5) {
      setError('Please enter a message of at least 5 characters.');
      return;
    }
    if (trimmedMessage.length > 3000) {
      setError('Message cannot exceed 3000 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: trimmedName,
        phone_number: formData.phone_number.trim(),
        message: trimmedMessage,
        phone_id: null,
      };

      await createInquiry(payload);
      setSuccess(true);
      setFormData({
        name: '',
        phone_number: '',
        message: '',
      });
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit inquiry. Please try again or reach us via WhatsApp.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const cleanNumber = (STORE_INFO.whatsapp || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello SK LABA PHONE! I would like to inquire about your smartphones and services.\nName: ${
        formData.name || 'Customer'
      }`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const quickTopics = [
    'I would like to check current price and stock availability.',
    'What is the warranty and battery health condition?',
    'How does Korea direct islandwide delivery work?',
    'What flexible instalment options are available for this device?',
  ];

  return (
    <div className="w-full min-h-screen bg-theme-bg text-theme-textPrimary pt-4 sm:pt-6 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8 pb-5 border-b border-theme-border/60">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Contact & Inquiries
            </h1>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Direct</span>
            </button>

            <a
              href={`tel:${STORE_INFO.phone}`}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              <span>Call Us</span>
            </a>
          </div>
        </div>

        {/* Centered Inquiry Form (Connected directly to createInquiry API) */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0A0F1E] border border-theme-border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 pb-4 border-b border-theme-border/60">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Send Customer Inquiry
              </h2>
              <p className="text-xs text-theme-textMuted mt-0.5">
                Your inquiry will be logged directly into our system for fast response.
              </p>
            </div>

            {/* Success Notification */}
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Inquiry Submitted Successfully!
                    </p>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Thank you for reaching out. Our customer service team has received your inquiry and will contact you via phone or WhatsApp shortly.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSuccess(false)}
                        className="text-xs font-semibold text-emerald-400 hover:text-white underline cursor-pointer"
                      >
                        Send another inquiry
                      </button>
                      <span className="text-emerald-500/40">·</span>
                      <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="text-xs font-semibold text-emerald-300 hover:text-white cursor-pointer flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Inquiry Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-theme-textSecondary mb-1.5">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-theme-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Kasun Perera"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-theme-textMuted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-medium text-theme-textSecondary mb-1.5">
                    Contact Number / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-theme-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="e.g. 077 123 4567 or +82 10..."
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-theme-textMuted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Topic Chips */}
              <div>
                <label className="block text-[11px] font-medium text-theme-textMuted uppercase tracking-wider mb-2">
                  Quick Suggestions (Click to add to message):
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickTopic(topic)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-theme-textSecondary hover:text-white transition-colors cursor-pointer text-left"
                    >
                      + {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-theme-textSecondary">
                    Your Message / Question <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-theme-textMuted">
                    {formData.message.length} / 3000
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your questions or details regarding the smartphone, delivery, or reservation here..."
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-theme-textMuted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50 resize-y"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <span>Submit Inquiry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
