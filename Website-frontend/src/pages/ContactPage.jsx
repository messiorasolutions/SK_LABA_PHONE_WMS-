import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  User,
  Send,
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

  return (
    <div className="relative w-full min-h-screen bg-theme-bg text-theme-textPrimary pt-6 sm:pt-10 pb-20 overflow-hidden">
      {/* Background ambient lighting for Glassmorphism depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-sky-400/10 rounded-full blur-[110px] pointer-events-none -z-0" />
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[300px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header matching the exact font style of 'Verified Customer Reviews' */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 sm:mb-14 pb-6 border-b border-white/[0.08]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight flex items-center gap-2.5">
              <span>Contact & Inquiries</span>
            </h1>
            <p className="text-xs sm:text-sm text-theme-textSecondary mt-2.5 leading-relaxed">
              Have questions or need assistance? Reach out to our team directly.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-normal flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Direct</span>
            </button>

            <a
              href={`tel:${STORE_INFO.phone}`}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-normal flex items-center gap-2 transition-all shadow-sm"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              <span>Call Us</span>
            </a>
          </div>
        </div>

        {/* Centered Inquiry Form with Premium Glassmorphism Look */}
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-7 sm:p-10 lg:p-12 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] ring-1 ring-white/[0.05] overflow-hidden">
            {/* Top glass reflection accent line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            
            {/* Ambient internal card glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Form Title & Description with matching typography */}
            <div className="mb-8 sm:mb-10 pb-6 border-b border-white/[0.08]">
              <h2 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
                Send Customer Inquiry
              </h2>
              <p className="text-xs sm:text-sm text-theme-textMuted mt-2 leading-relaxed">
                Your inquiry will be logged directly into our system for fast response.
              </p>
            </div>

            {/* Success Notification */}
            {success && (
              <div className="mb-8 p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 animate-in fade-in shadow-lg">
                <div className="flex items-start gap-3.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm font-normal text-white">
                      Inquiry Submitted Successfully!
                    </p>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Thank you for reaching out. Our customer service team has received your inquiry and will contact you via phone or WhatsApp shortly.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSuccess(false)}
                        className="text-xs font-normal text-emerald-400 hover:text-white underline cursor-pointer"
                      >
                        Send another inquiry
                      </button>
                      <span className="text-emerald-500/40">·</span>
                      <button
                        type="button"
                        onClick={handleWhatsApp}
                        className="text-xs font-normal text-emerald-300 hover:text-white cursor-pointer flex items-center gap-1"
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
              <div className="mb-8 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-in fade-in shadow-lg">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Inquiry Form with Spacious Gaps */}
            <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-normal text-slate-300 mb-2.5">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-theme-textMuted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Kasun Perera"
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.12] text-white text-xs sm:text-sm placeholder:text-theme-textMuted focus:outline-none focus:border-blue-400 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/15 backdrop-blur-md transition-all shadow-inner disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-normal text-slate-300 mb-2.5">
                    Contact Number / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-theme-textMuted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="e.g. 077 123 4567 or +82 10..."
                      required
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.12] text-white text-xs sm:text-sm placeholder:text-theme-textMuted focus:outline-none focus:border-blue-400 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/15 backdrop-blur-md transition-all shadow-inner disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Message Textarea with comfortable height and gap */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-xs font-normal text-slate-300">
                    Your Message / Question <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-theme-textMuted">
                    {formData.message.length} / 3000
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your questions or details regarding the smartphone, delivery, or reservation here..."
                    required
                    disabled={loading}
                    className="w-full px-4 py-3.5 sm:py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.12] text-white text-xs sm:text-sm placeholder:text-theme-textMuted focus:outline-none focus:border-blue-400 focus:bg-white/[0.08] focus:ring-4 focus:ring-blue-500/15 backdrop-blur-md transition-all shadow-inner disabled:opacity-50 resize-y leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
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
