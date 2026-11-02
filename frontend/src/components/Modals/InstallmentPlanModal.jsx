import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Calculator } from 'lucide-react';

export default function InstallmentPlanModal({
  isOpen,
  onClose,
  onSubmit,
  initial = null,
  loading = false,
}) {
  const [planName, setPlanName] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);
  const [terms, setTerms] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  const quickTenures = [3, 6, 12, 18, 24, 36];

  useEffect(() => {
    if (initial) {
      setPlanName(initial.plan_name || '');
      setNumberOfMonths(Number(initial.number_of_months) || 12);
      setInterestRate(initial.interest_rate !== undefined ? Number(initial.interest_rate) : 0);
      setAdditionalFee(initial.additional_fee !== undefined ? Number(initial.additional_fee) : 0);
      setTerms(initial.terms || '');
      setIsActive(initial.is_active === 1 || initial.is_active === true);
    } else {
      setPlanName('');
      setNumberOfMonths(12);
      setInterestRate(0);
      setAdditionalFee(0);
      setTerms('Standard installment terms apply. Monthly payment deducted via bank or credit card.');
      setIsActive(true);
    }
    setError(null);
  }, [initial, isOpen]);

  if (!isOpen) return null;

  // Sample illustrative installment calculation based on a $1,000 benchmark phone
  const sampleBenchmark = 1000;
  const parsedMonths = Math.max(1, parseInt(numberOfMonths, 10) || 1);
  const parsedRate = Math.max(0, parseFloat(interestRate) || 0);
  const parsedFee = Math.max(0, parseFloat(additionalFee) || 0);

  const sampleTotal = sampleBenchmark * (1 + parsedRate / 100) + parsedFee;
  const sampleMonthly = sampleTotal / parsedMonths;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!planName.trim()) {
      setError('Plan name is required.');
      return;
    }

    if (parsedMonths < 1 || parsedMonths > 120) {
      setError('Duration must be between 1 and 120 months.');
      return;
    }

    if (parsedRate < 0 || parsedRate > 100) {
      setError('Interest rate must be between 0% and 100%.');
      return;
    }

    if (parsedFee < 0) {
      setError('Additional fee cannot be negative.');
      return;
    }

    const payload = {
      plan_name: planName.trim(),
      number_of_months: parsedMonths,
      interest_rate: parsedRate,
      additional_fee: parsedFee,
      terms: terms.trim() || undefined,
      is_active: isActive,
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setError(res.error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />
              <span>{initial ? 'Edit Installment Plan' : 'Create Installment Plan'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {initial ? `Update SKLABA_Plan_${initial.installment_plan_id} terms` : 'Configure financing plan for customer phones (SRS MG-11)'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* 1. Plan Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. 12 Months 0% Interest Promo Plan"
                maxLength={150}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>

            {/* 2. Number of Months (Tenure) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tenure Duration (Months) <span className="text-red-500">*</span>
              </label>

              {/* Quick Tenure Selection Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickTenures.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNumberOfMonths(m)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      Number(numberOfMonths) === m
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m} Mos
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="120"
                step="1"
                value={numberOfMonths}
                onChange={(e) => setNumberOfMonths(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>

            {/* 3. Interest Rate & Additional Fee (2-column grid) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Rate (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="0.00"
                    className="w-full pr-8 pl-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                  <span className="absolute right-3 text-slate-400 font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Set 0 for 0% interest</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Fee ($)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-bold text-xs pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={additionalFee}
                    onChange={(e) => setAdditionalFee(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">One-time processing fee</span>
              </div>
            </div>

            {/* 4. Live Calculation Preview Card */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                <Calculator className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Sample Estimate ($1,000 Device)</span>
              </div>
              <div className="flex items-baseline justify-between pt-1 text-xs">
                <span className="text-slate-600 dark:text-slate-400">Monthly Payment:</span>
                <span className="text-sm font-bold text-[#2563EB] dark:text-blue-400">
                  ${sampleMonthly.toFixed(2)} / month
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-blue-200/50 dark:border-blue-900/40">
                <span>Total Repayment:</span>
                <span>${sampleTotal.toFixed(2)} across {parsedMonths} months</span>
              </div>
            </div>

            {/* 5. Terms & Policy Text */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terms & Conditions Text
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="e.g. Valid with major Korean credit cards. 0% interest valid for 12 months."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
              />
            </div>

            {/* 6. Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Active Status
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                  Enable this plan for selection on smartphones
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563EB] focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !planName.trim()}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

