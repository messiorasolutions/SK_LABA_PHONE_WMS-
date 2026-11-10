import React, { useState, useEffect } from 'react';
import {
  Percent,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  DollarSign,
  History,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import marketplaceAdminService from '../../services/marketplaceAdminService';

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-US');
}

export default function MarketplaceSettingsView() {
  // Sub-tabs: 'commission' | 'seller_terms' | 'buyer_terms'
  const [activeSection, setActiveSection] = useState('commission');

  // -------------------------------------------------------------
  // 1. COMMISSION STATE
  // -------------------------------------------------------------
  const [commissionRate, setCommissionRate] = useState('5.00');
  const [initialCommission, setInitialCommission] = useState('5.00');
  const [commissionLoading, setCommissionLoading] = useState(true);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionSuccess, setCommissionSuccess] = useState('');
  const [commissionError, setCommissionError] = useState('');

  // Interactive Live Calculator Simulation
  const [simPrice, setSimPrice] = useState('100000');

  const fetchCommission = async () => {
    setCommissionLoading(true);
    setCommissionError('');
    try {
      const res = await marketplaceAdminService.getCommission();
      const rate = res?.data?.commission_percentage ?? 5.0;
      const formatted = Number(rate).toFixed(2);
      setCommissionRate(formatted);
      setInitialCommission(formatted);
    } catch (err) {
      setCommissionError(err.response?.data?.message || err.message || 'Failed to load commission settings');
    } finally {
      setCommissionLoading(false);
    }
  };

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    setCommissionError('');
    setCommissionSuccess('');

    const num = parseFloat(commissionRate);
    if (isNaN(num) || num < 0 || num > 100) {
      setCommissionError('Commission percentage must be a valid number between 0% and 100%.');
      return;
    }

    setCommissionSaving(true);
    try {
      await marketplaceAdminService.updateCommission(num);
      setInitialCommission(num.toFixed(2));
      setCommissionSuccess(`Platform commission rate updated to ${num.toFixed(2)}%! This is now active across all customer portals.`);
      setTimeout(() => setCommissionSuccess(''), 5000);
    } catch (err) {
      setCommissionError(err.response?.data?.message || err.message || 'Failed to update commission rate');
    } finally {
      setCommissionSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 2. TERMS & CONDITIONS STATE
  // -------------------------------------------------------------
  const [termType, setTermType] = useState('SELLER');
  const [termsTitle, setTermsTitle] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [currentActiveTerms, setCurrentActiveTerms] = useState(null);
  const [termsHistory, setTermsHistory] = useState([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termsSaving, setTermsSaving] = useState(false);
  const [termsSuccess, setTermsSuccess] = useState('');
  const [termsError, setTermsError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const fetchTerms = async (type = 'SELLER') => {
    setTermsLoading(true);
    setTermsError('');
    try {
      const [activeRes, historyRes] = await Promise.all([
        marketplaceAdminService.getActiveTerms(type).catch(() => null),
        marketplaceAdminService.getTermsHistory(type).catch(() => null),
      ]);

      const active = activeRes?.data || activeRes;
      if (active) {
        setCurrentActiveTerms(active);
        setTermsTitle(active.title || `SK LABA PHONE Marketplace ${type === 'SELLER' ? 'Seller' : 'Buyer'} Terms & Conditions`);
        setTermsContent(active.content || '');

        // Auto-suggest next version
        const vNum = parseFloat(active.version || '1.0');
        const nextV = !isNaN(vNum) ? (vNum + 0.1).toFixed(1) : `${active.version || '1.0'}.1`;
        setTermsVersion(nextV);
      } else {
        setTermsTitle(`SK LABA PHONE Marketplace ${type === 'SELLER' ? 'Seller' : 'Buyer'} Terms & Conditions`);
        setTermsVersion('1.0');
        setTermsContent('');
      }

      const history = historyRes?.data || historyRes || [];
      setTermsHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      setTermsError(err.response?.data?.message || err.message || 'Failed to load terms');
    } finally {
      setTermsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommission();
    fetchTerms(termType);
  }, []);

  const handleTermTypeSwitch = (type) => {
    setTermType(type);
    setTermsSuccess('');
    setTermsError('');
    fetchTerms(type);
  };

  const handleSaveTerms = async (e) => {
    e.preventDefault();
    setTermsError('');
    setTermsSuccess('');

    if (!termsTitle.trim()) {
      setTermsError('Terms title is required.');
      return;
    }
    if (!termsVersion.trim()) {
      setTermsError('Terms version is required (e.g. 1.1).');
      return;
    }
    if (!termsContent.trim() || termsContent.trim().length < 20) {
      setTermsError('Terms content must be at least 20 characters.');
      return;
    }

    if (
      !window.confirm(
        `Publish new ${termType} Terms & Conditions Version ${termsVersion.trim()}?\n\nThis will become the active legal version required for all new ${
          termType === 'SELLER' ? 'phone seller submissions' : 'orders'
        }.`
      )
    ) {
      return;
    }

    setTermsSaving(true);
    try {
      await marketplaceAdminService.saveTermsVersion({
        term_type: termType,
        version: termsVersion.trim(),
        title: termsTitle.trim(),
        content: termsContent.trim(),
      });
      setTermsSuccess(
        `New ${termType} Terms & Conditions v${termsVersion.trim()} published successfully!`
      );
      setTimeout(() => setTermsSuccess(''), 5000);
      fetchTerms(termType);
    } catch (err) {
      setTermsError(err.response?.data?.message || err.message || 'Failed to publish new terms version');
    } finally {
      setTermsSaving(false);
    }
  };

  // Live calculator calculation
  const numericSimPrice = parseFloat(simPrice) || 0;
  const currentCommPct = parseFloat(commissionRate) || 0;
  const simCommissionAmount = Math.round((numericSimPrice * currentCommPct) / 100);
  const simSellerPayout = Math.max(0, numericSimPrice - simCommissionAmount);

  return (
    <div className="space-y-6">
      {/* Settings Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('commission')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'commission'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Platform Commission Percentage</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('terms');
            if (termType !== 'SELLER') handleTermTypeSwitch('SELLER');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'terms' && termType === 'SELLER'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Seller Terms & Conditions</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('terms');
            if (termType !== 'BUYER') handleTermTypeSwitch('BUYER');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'terms' && termType === 'BUYER'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Buyer Terms & Conditions</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. COMMISSION SETTINGS & SIMULATOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'commission' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Commission Editor Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  Marketplace Financial Rule
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Active Rate: {initialCommission}%
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Platform Commission Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Configure the platform commission charged when a smartphone is successfully sold through the SK LABA PHONE Marketplace. This value is used by all customer-facing earnings calculators, seller forms, and payout reconciliation.
              </p>
            </div>

            {commissionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{commissionSuccess}</span>
              </div>
            )}

            {commissionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{commissionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCommission} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                  Platform Commission Percentage (%)
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    disabled={commissionLoading || commissionSaving}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter value between 0.00% and 100.00% (Standard default: 5.00%).
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {['0.00', '2.50', '5.00', '7.50', '10.00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCommissionRate(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        commissionRate === preset
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={commissionSaving || commissionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{commissionSaving ? 'Saving...' : 'Save Commission Rate'}</span>
                </button>

                {commissionRate !== initialCommission && (
                  <button
                    type="button"
                    onClick={() => setCommissionRate(initialCommission)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Real-time Earnings Simulator Card */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Earnings Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preview how sellers and buyers will see prices calculated with the currently configured <strong>{commissionRate}%</strong> rate:
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Simulated Listed Price (Rs.):
                </label>
                <input
                  type="number"
                  value={simPrice}
                  onChange={(e) => setSimPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Simulation Breakdown */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs shadow-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Customer Listed Price:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(numericSimPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span>Platform Fee ({commissionRate}%):</span>
                  <span className="font-semibold">- {formatCurrency(simCommissionAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">Expected Seller Payout:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(simSellerPayout)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ✓ Payout is held in escrow until the buyer receives and confirms phone delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TERMS & CONDITIONS EDITOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'terms' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  Legal & Compliance Management
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {termType === 'SELLER' ? 'Seller Terms & Conditions' : 'Buyer Terms & Conditions'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Versioned legal agreement required before any {termType === 'SELLER' ? 'seller can submit a phone' : 'buyer can place an order'}.
                </p>
              </div>

              {currentActiveTerms && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold">
                    Live Active: v{currentActiveTerms.version}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreview ? 'Hide Preview' : 'Preview Live'}</span>
                  </button>
                </div>
              )}
            </div>

            {termsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{termsSuccess}</span>
              </div>
            )}

            {termsError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{termsError}</span>
              </div>
            )}

            {/* Live Preview Box */}
            {showPreview && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Preview (As Shown to Customer):
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">v{termsVersion}</span>
                </div>
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">{termsTitle}</h5>
                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                  {termsContent || 'No content entered yet.'}
                </div>
              </div>
            )}

            {/* Editor Form */}
            <form onSubmit={handleSaveTerms} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-9">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={termsTitle}
                    onChange={(e) => setTermsTitle(e.target.value)}
                    disabled={termsSaving || termsLoading}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    New Version Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.1"
                    value={termsVersion}
                    onChange={(e) => setTermsVersion(e.target.value)}
                    disabled={termsSaving || termsLoading}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Terms & Conditions Content <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Supports numbered clauses, paragraphs, and line breaks
                  </span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  disabled={termsSaving || termsLoading}
                  placeholder="Enter the full legal clauses and terms..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-400">
                  Publishing this new version will automatically archive previous versions and become active immediately on the website.
                </p>

                <button
                  type="submit"
                  disabled={termsSaving || termsLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{termsSaving ? 'Publishing...' : `Publish ${termType} Terms v${termsVersion}`}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Version History Table */}
          {termsHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Version History ({termType})</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-3 py-2">Version</th>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Published Date</th>
                      <th className="px-3 py-2">Published By</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {termsHistory.map((h) => (
                      <tr key={h.id}>
                        <td className="px-3 py-2.5 font-bold font-mono text-slate-900 dark:text-white">
                          v{h.version}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                          {h.title}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {h.created_by_name || 'Admin'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              h.is_active
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {h.is_active ? 'Active' : 'Archived'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
