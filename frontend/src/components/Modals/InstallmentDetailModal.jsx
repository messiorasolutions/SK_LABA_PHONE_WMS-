import React from 'react';
import { X, CreditCard, Calculator } from 'lucide-react';

export default function InstallmentDetailModal({
  isOpen,
  onClose,
  plan = null,
}) {
  if (!isOpen || !plan) return null;

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[500px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#2563EB]" />
              <span>SKLABA_Plan_{plan.installment_plan_id}: {plan.plan_name}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Installment Plan Overview
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* General Information Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plan Specifications
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Plan ID</span>
                <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono">
                  SKLABA_Plan_{plan.installment_plan_id}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Plan Name</span>
                <span className="col-span-2 text-slate-900 dark:text-slate-100 font-semibold">
                  {plan.plan_name}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Tenure</span>
                <span className="col-span-2 text-[#2563EB] font-bold">
                  {plan.number_of_months} Months
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Interest Rate</span>
                <span className="col-span-2">
                  {rate === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      0.00% Zero Interest
                    </span>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{rate.toFixed(2)}%</span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Additional Fee</span>
                <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">
                  {fee > 0 ? `$${fee.toFixed(2)}` : '$0.00 (No Extra Fees)'}
                </span>
              </div>
              <div className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <span className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        plan.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{plan.is_active ? 'Active' : 'Inactive'}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Benchmark Repayment Calculator Preview */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Monthly Repayment Benchmarks</span>
              </span>
              <span>{months} Months</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-slate-600 dark:text-slate-400">$500 Device</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100">${sample500.monthly}/mo</span>
                  <span className="block text-[10px] text-slate-400">Total: ${sample500.total}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50/30 dark:bg-blue-950/20">
                <span className="font-semibold text-slate-800 dark:text-slate-200">$1,000 Device</span>
                <div className="text-right">
                  <span className="font-bold text-[#2563EB] dark:text-blue-400 text-sm">${sample1000.monthly}/mo</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Total: ${sample1000.total}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-slate-600 dark:text-slate-400">$1,500 Device</span>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-slate-100">${sample1500.monthly}/mo</span>
                  <span className="block text-[10px] text-slate-400">Total: ${sample1500.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {plan.terms && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Customer Disclosure & Terms Text
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {plan.terms}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
            <span>Created: {formatDate(plan.created_at)}</span>
            <span>Updated: {formatDate(plan.updated_at)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

