import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Calculator,
  Percent,
  Clock,
} from 'lucide-react';

export default function InstallmentPlanFormView({
  initial = null,
  onBack,
  onSubmit,
  submitting = false,
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
  }, [initial]);

  const parsedMonths = Math.max(1, parseInt(numberOfMonths, 10) || 1);
  const parsedRate = Math.max(0, parseFloat(interestRate) || 0);
  const parsedFee = Math.max(0, parseFloat(additionalFee) || 0);

  const sampleBenchmark = 1000;
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Top Breadcrumb Navigation ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Installment Plans</span>
        </button>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              {initial ? 'Edit Installment Plan' : 'Create Installment Plan'}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              Configure financing terms, duration, interest rate, and client payment conditions
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Form ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form details */}
          <div className="lg:col-span-2 space-y-5">
            {/* General Plan Parameters */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Plan Identification & Terms
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Koko 3 Months 0% Interest Plan"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {/* Tenure Selection */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration (Months) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={numberOfMonths}
                  onChange={(e) => setNumberOfMonths(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />

                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-[11px] font-normal text-slate-400">Quick Tenures:</span>
                  {quickTenures.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNumberOfMonths(t)}
                      className={`px-3 py-1 text-xs font-normal rounded-full border transition-colors cursor-pointer ${
                        Number(numberOfMonths) === t
                          ? 'border-slate-900 dark:border-rose-800 bg-slate-900 text-white dark:bg-rose-950/40 dark:text-rose-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {t} Months
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Terms & Conditions (Optional)
                </label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  placeholder="Enter late payment fees, bank eligibility, or customer requirements..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-neutral-500"
                />
              </div>
            </div>
          </div>

          {/* Right 1 Col: Interest, Fees & Calculator */}
          <div className="space-y-5">
            {/* Rates & Fees Card */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Interest & Processing Fees
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Annual / Fixed Interest Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] font-normal text-slate-400 mt-1">
                  Set to 0% for zero-interest financing plans.
                </p>
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-300 mb-1.5">
                  Additional Processing Fee ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-900 dark:text-white focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-normal text-slate-700 dark:text-slate-300">
                    Plan is Active and available for phone catalog assignment
                  </span>
                </label>
              </div>
            </div>

            {/* Illustrative Calculator Card (White background, theme accents) */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-normal text-slate-800 dark:text-slate-200">
                <Calculator className="w-4 h-4 text-rose-600" />
                <span>Sample Monthly Payment ($1,000 Device)</span>
              </div>

              <div className="space-y-2 text-xs font-normal pt-1">
                <div className="flex justify-between text-slate-500">
                  <span>Financed Amount:</span>
                  <span className="text-slate-800 dark:text-slate-200">$1,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Repayment:</span>
                  <span className="text-slate-800 dark:text-slate-200">${sampleTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Monthly Installment:</span>
                  <span className="font-normal text-sm text-slate-900 dark:text-white">
                    ${sampleMonthly.toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? 'Saving Plan...' : (initial ? 'Update Installment Plan' : 'Create Installment Plan')}</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="w-full py-2 px-4 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

