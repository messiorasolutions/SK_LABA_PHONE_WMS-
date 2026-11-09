import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageCircle,
  Tag,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { getShopInfo, updateShopInfo } from '../services/shopInfoService';

export default function ShopInformationPage() {
  const [formData, setFormData] = useState({
    shop_name: '',
    tagline: '',
    address: '',
    opening_hours: '',
    email: '',
    whatsapp_number: '',
    phone_number: '',
  });

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getShopInfo();
      if (data) {
        const mapped = {
          shop_name: data.shop_name || 'SK LABA PHONE',
          tagline: data.tagline || 'ලාබ ෆෝන්',
          address: data.address || 'Dongdaemun-gu, Seoul, South Korea',
          opening_hours: data.opening_hours || 'Mon - Sun: 10:00 AM - 9:00 PM (KST)',
          email: data.email || 'contact@sklabaphone.com',
          whatsapp_number: data.whatsapp_number || '+82 10-5892-7482',
          phone_number: data.phone_number || '+82 10-5892-7482',
        };
        setFormData(mapped);
        setInitialData(mapped);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load shop information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setSuccessMessage('');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Basic frontend validations
    if (!formData.shop_name.trim()) {
      setErrorMessage('Shop name is required.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Store address is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid contact email.');
      return;
    }
    if (!formData.whatsapp_number.trim()) {
      setErrorMessage('WhatsApp number is required.');
      return;
    }
    if (!formData.phone_number.trim()) {
      setErrorMessage('Mobile / Hotline number is required.');
      return;
    }

    try {
      setSaving(true);
      const res = await updateShopInfo(formData);
      setSuccessMessage(res.message || 'Shop information updated successfully! All website contact links are now live.');
      if (res.data) {
        const mapped = {
          shop_name: res.data.shop_name,
          tagline: res.data.tagline,
          address: res.data.address,
          opening_hours: res.data.opening_hours,
          email: res.data.email,
          whatsapp_number: res.data.whatsapp_number,
          phone_number: res.data.phone_number,
        };
        setFormData(mapped);
        setInitialData(mapped);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update shop information.');
    } finally {
      setSaving(false);
    }
  };

  const cleanWhatsAppNumber = (formData.whatsapp_number || '').replace(/\D/g, '');
  const testWhatsAppUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    'Hello SK LABA PHONE! Testing WhatsApp shop configuration.'
  )}`;

  const isDirty = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight leading-none">
              Shop Information
            </h1>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-full">
              Live Storefront Settings
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Manage your store address, operating hours, official contact email, and active WhatsApp number. Changes update the customer website immediately.
          </p>
        </div>

        {cleanWhatsAppNumber && (
          <a
            href={testWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
            title="Open WhatsApp chat with configured number"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Test WhatsApp Chat</span>
            <ExternalLink className="w-3 h-3 text-emerald-500" />
          </a>
        )}
      </div>

      {/* ── Feedback Alerts ─────────────────────────────────────── */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-xl shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between rounded-xl shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading shop settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left 2 Columns: Edit Form ───────────────────────────── */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
            >
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Storefront Contact & Address Details
                </span>
                {isDirty && (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>

              {/* Grid 1: Name and Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="shop_name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. SK LABA PHONE"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store Tagline / Badge
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      placeholder="e.g. ලාබ ෆෝන්"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: WhatsApp Number (Special Focus) & Hotline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleChange}
                      required
                      placeholder="e.g. +82 10-5892-7482"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-300 dark:border-emerald-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 leading-tight">
                    Dynamic: Controls all customer WhatsApp links on the website directly (does NOT read from .env).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile / Hotline Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      placeholder="e.g. +82 10-5892-7482"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Direct phone call link for mobile callers.
                  </p>
                </div>
              </div>

              {/* Grid 3: Email and Opening Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="e.g. contact@sklabaphone.com"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Hours / Store Hours <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      name="opening_hours"
                      value={formData.opening_hours}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Mon - Sun: 10:00 AM - 9:00 PM (KST)"
                      className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Full Width: Shop Address */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shop Physical Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Dongdaemun-gu, Seoul, South Korea"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none leading-relaxed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This address is shown in the website footer, giveaway rules, and inquiries card.
                </p>
              </div>

              {/* Submit and Reset Button Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-neutral-900 hover:from-rose-500 hover:to-neutral-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right 1 Column: Live Website Preview ───────────────── */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Live Footer Preview
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Realtime Output
                </span>
              </div>

              {/* Preview Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-white">{formData.shop_name || 'SK LABA PHONE'}</span>
                  {formData.tagline && (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/30 text-red-200">
                      {formData.tagline}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Leading provider of authentic flagship smartphones direct from South Korea.
                </p>
              </div>

              {/* Preview Details */}
              <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{formData.address || 'Dongdaemun-gu, Seoul, South Korea'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formData.opening_hours || 'Mon - Sun: 10:00 AM - 9:00 PM (KST)'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formData.email || 'contact@sklabaphone.com'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formData.phone_number || '+82 10-5892-7482'}</span>
                </div>
              </div>

              {/* Preview Action Buttons */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp: {formData.whatsapp_number || '+82 10-5892-7482'}</span>
                </div>
                <p className="text-[10px] text-center text-slate-400">
                  Customers tapping this will chat directly with {formData.whatsapp_number || '+82 10-5892-7482'}
                </p>
              </div>
            </div>

            {/* Explanatory Help Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white block">
                💡 How This Works
              </span>
              <p className="text-[11px] leading-relaxed">
                1. Whenever you change the WhatsApp number or address above, the change is saved in the database.
              </p>
              <p className="text-[11px] leading-relaxed">
                2. The website fetches this directly via API without needing code recompilations or .env file edits.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

