import React from 'react';
import {
  ArrowLeft,
  CreditCard,
  Calculator,
  Percent,
  Clock,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export default function InstallmentPlanDetailView({
  plan,
  onBack,
  onEdit,
}) {
  if (!plan) return null;

  const months = Number(plan.number_of_months || 1);
  const rate = Number(plan.interest_rate || 0);
  const fee = Number(plan.additional_fee || 0);

  const calculateSample = (price) => {
    const total = price * (1 + rate / 100) + fee;
    const monthly = total / months;
    return {
      monthly: monthly.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const sample500 = calculateSample(500);
  const sample1000 = calculateSample(1000);
  const sample1500 = calculateSample(1500);

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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
              {plan.plan_name}
            </h1>
            <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
              SKLABA_Plan_{plan.installment_plan_id} · Financing Terms & Policy Breakdown
            </p>
          </div>
        </div>

        <button
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit This Plan</span>
        </button>
      </div>

      {/* ── Summary Cards (Clean Theme & Normal Font, no blue texts or green bg) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tenure */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Tenure Duration
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {months} Months
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            Fixed monthly billing cycle
          </div>
        </div>

        {/* Interest Rate */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Interest Rate
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {rate === 0 ? '0.00% (Zero Interest)' : `${rate.toFixed(2)}%`}
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            {rate === 0 ? 'No interest added' : 'Standard financing fee'}
          </div>
        </div>

        {/* Processing Fee */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Processing Fee
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {fee > 0 ? `$${fee.toFixed(2)}` : '$0.00'}
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            One-time administrative fee
          </div>
        </div>

        {/* Plan Status */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-normal text-slate-400 uppercase tracking-wider">
            Plan Status
          </div>
          <div className="text-lg font-normal text-slate-900 dark:text-white mt-1">
            {plan.is_active ? 'Active' : 'Inactive'}
          </div>
          <div className="text-[11px] font-normal text-slate-500 mt-0.5">
            {plan.is_active ? 'Available for catalog selection' : 'Hidden from storefront'}
          </div>
        </div>
      </div>

      {/* ── Illustrative Breakdown & Terms ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Payment Benchmark Calculations */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Illustrative Monthly Customer Repayments
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* $500 Phone */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="text-[11px] font-normal text-slate-400 uppercase">
                  $500 Device
                </div>
                <div className="text-base font-normal text-slate-900 dark:text-white">
                  ${sample500.monthly} <span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  Total: ${sample500.total}
                </div>
              </div>

              {/* $1,000 Phone */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="text-[11px] font-normal text-slate-400 uppercase">
                  $1,000 Device
                </div>
                <div className="text-base font-normal text-slate-900 dark:text-white">
                  ${sample1000.monthly} <span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  Total: ${sample1000.total}
                </div>
              </div>

              {/* $1,500 Phone */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="text-[11px] font-normal text-slate-400 uppercase">
                  $1,500 Device
                </div>
                <div className="text-base font-normal text-slate-900 dark:text-white">
                  ${sample1500.monthly} <span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  Total: ${sample1500.total}
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Financing Policy */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="text-xs font-normal text-slate-700 dark:text-slate-300">
              Financing Conditions & Customer Terms
            </div>
            <p className="text-xs font-normal text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {plan.terms || 'Standard installment policy applies. Monthly payments are debited automatically.'}
            </p>
          </div>
        </div>

        {/* Actions Card */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <button
              onClick={() => onEdit(plan)}
              className="w-full py-2.5 px-4 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Installment Plan</span>
            </button>

            <button
              onClick={onBack}
              className="w-full py-2 px-4 text-xs font-normal rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-center"
            >
              Back to Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

