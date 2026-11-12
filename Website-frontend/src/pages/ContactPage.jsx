import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  User,
} from 'lucide-react';
import { useShopInfo } from '../context/ShopInfoContext';
import { createInquiry } from '../services/inquiryService';
import whatsappIcon from '../assets/icons/whatsappicon.png';
import facebookIcon from '../assets/facebook.png';
import tiktokIcon from '../assets/tiktok.png';

export default function ContactPage() {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
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
    const text = `Hello SK LABA PHONE! I would like to inquire about your smartphones and services.\nName: ${
      formData.name || 'Customer'
    }`;
    window.open(getWhatsAppUrl(text), '_blank');
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] bg-theme-bg text-theme-textPrimary pt-4 sm:pt-6 pb-6 overflow-hidden">
      {/* Background ambient lighting for Glassmorphism depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-sky-400/10 rounded-full blur-[110px] pointer-events-none -z-0" />
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[300px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 border-b border-white/[0.08]">
          <div>
            <h1 className="text-xl sm:text-2xl font-normal text-white tracking-tight flex items-center gap-2">
              <span>Contact Us</span>
            </h1>
            <p className="text-xs text-theme-textSecondary mt-1 leading-relaxed">
              Have questions or need assistance? Reach out to our team directly.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-normal flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 object-contain" />
              <span>WhatsApp</span>
            </button>

            <a
              href="https://www.facebook.com/share/1F1UeLv34p/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-normal flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105 group"
            >
              <img src={facebookIcon} alt="Facebook" className="w-4 h-4 object-contain group-hover:scale-110 transition-transform" />
              <span>Facebook</span>
            </a>

            <a
              href="https://www.tiktok.com/@sk16858?_r=1&_t=ZS-9BI1cPiClvt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-normal flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105 group"
            >
              <img src={tiktokIcon} alt="TikTok" className="w-4 h-4 object-contain group-hover:scale-110 transition-transform" />
              <span>TikTok</span>
            </a>

            <a
              href={`tel:${shopInfo.phone}`}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-normal flex items-center gap-2 transition-all shadow-sm"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              <span>Call Us</span>
            </a>
          </div>
        </div>

        {/* Centered Inquiry Form with Light Blue Outline */}
        <div className="max-w-[640px] mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-[#090E1D]/90 backdrop-blur-2xl border border-sky-500/35 hover:border-sky-400/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-sky-500/15 overflow-hidden transition-colors duration-300">
            {/* Top glass reflection accent line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400/50 via-white/30 to-transparent pointer-events-none" />
            
            {/* Ambient internal card glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Form Title & Description */}
            <div className="mb-5 sm:mb-6 pb-4 border-b border-white/[0.08]">
              <h2 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
                Send Customer Inquiry
              </h2>
              <p className="text-xs text-theme-textSecondary mt-1 leading-relaxed">
                Your inquiry will be logged directly into our system for fast response.
              </p>
            </div>

            {/* Success Notification */}
            {success && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 animate-in fade-in shadow-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-normal text-white">
                      Inquiry Submitted Successfully!
                    </p>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Thank you for reaching out. Our customer service team will contact you shortly.
                    </p>
                    <div className="pt-1.5 flex flex-wrap items-center gap-3">
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
                        className="text-xs font-normal text-emerald-300 hover:text-white cursor-pointer flex items-center gap-1.5"
                      >
                        <img src={whatsappIcon} alt="WhatsApp" className="w-3.5 h-3.5 object-contain" />
                        <span>Chat on WhatsApp now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-in fade-in shadow-lg">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Inquiry Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="group/field">
                  <label className="block text-xs font-normal text-slate-300 mb-1.5">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-300 group-focus-within/field:text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-[#070b16] border border-sky-500/35 hover:border-sky-400/60 focus:border-sky-400 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 backdrop-blur-md transition-all shadow-inner disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="group/field">
                  <label className="block text-xs font-normal text-slate-300 mb-1.5">
                    Contact Number / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-300 group-focus-within/field:text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-[#070b16] border border-sky-500/35 hover:border-sky-400/60 focus:border-sky-400 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 backdrop-blur-md transition-all shadow-inner disabled:opacity-50 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="group/field">
                <label className="block text-xs font-normal text-slate-300 mb-1.5">
                  Your Message / Question <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full min-h-[88px] px-3.5 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-[#070b16] border border-sky-500/35 hover:border-sky-400/60 focus:border-sky-400 text-white text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 backdrop-blur-md transition-all shadow-inner disabled:opacity-50 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative inline-flex items-center justify-center p-[0.5px] rounded-full bg-gradient-to-r from-red-600/80 via-blue-700/80 to-blue-900/80 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-black/80 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="w-full inline-flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-6 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-normal transition-colors duration-200">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <span>Submit Inquiry</span>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
