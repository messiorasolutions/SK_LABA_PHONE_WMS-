import React from 'react';
import useInstallmentPlans from '../hooks/useInstallmentPlans';
import InstallmentPlanFormView from '../components/Installments/InstallmentPlanFormView';
import InstallmentPlanDetailView from '../components/Installments/InstallmentPlanDetailView';
import ConfirmDeleteModal from '../components/Modals/ConfirmDeleteModal';

import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Clock,
  Percent,
} from 'lucide-react';

export default function InstallmentPlansPage() {
  const {
    plans,
    loading,
    submitting,
    metrics,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    durationFilter,
    setDurationFilter,
    isAddOpen,
    setIsAddOpen,
    editingPlan,
    setEditingPlan,
    detailPlan,
    setDetailPlan,
    deletingPlan,
    setDeletingPlan,
    toast,
    handleRefresh,
    handleCreatePlan,
    handleUpdatePlan,
    handleToggleStatus,
    handleDeletePlan,
  } = useInstallmentPlans();

  const calculateSampleMonthly = (plan, benchmark = 1000) => {
    const months = Number(plan.number_of_months || 1);
    const rate = Number(plan.interest_rate || 0);
    const fee = Number(plan.additional_fee || 0);
    const total = benchmark * (1 + rate / 100) + fee;
    return (total / months).toFixed(2);
  };

  // ── 1. Full Page View: Create New Plan ──────────────────────────────
  if (isAddOpen) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <InstallmentPlanFormView
          onBack={() => setIsAddOpen(false)}
          onSubmit={async (data) => {
            const res = await handleCreatePlan(data);
            if (res?.success) {
              setIsAddOpen(false);
            }
            return res;
          }}
          submitting={submitting}
        />
      </div>
    );
  }

  // ── 2. Full Page View: Edit Existing Plan ───────────────────────────
  if (editingPlan) {
    return (
      <div className="pb-12">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
        <InstallmentPlanFormView
          initial={editingPlan}
          onBack={() => setEditingPlan(null)}
          onSubmit={async (data) => {
            const res = await handleUpdatePlan(editingPlan.installment_plan_id, data);
            if (res?.success) {
              setEditingPlan(null);
            }
            return res;
          }}
          submitting={submitting}
        />
      </div>
    );
  }

  // ── 3. Full Page View: Plan Details ─────────────────────────────────
  if (detailPlan) {
    return (
      <div className="pb-12">
        <InstallmentPlanDetailView
          plan={detailPlan}
          onBack={() => setDetailPlan(null)}
          onEdit={(p) => {
            setDetailPlan(null);
            setEditingPlan(p);
          }}
        />
      </div>
    );
  }

  // ── 4. Main Installment Plans Table View ────────────────────────────
  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-normal rounded-full shadow-xl animate-in slide-in-from-top-2 border border-neutral-800">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-normal text-slate-900 dark:text-white tracking-tight">
            Installment Plans Management
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Configure monthly financing tenures, interest rates, and customer terms (SRS MG-11)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors cursor-pointer"
            title="Refresh plans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full shadow-sm border border-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Plans */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Plans
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.totalPlans} <span className="text-xs font-normal text-slate-400">plans</span>
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Plans
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.activePlans} <span className="text-xs font-normal text-slate-400">active</span>
            </div>
          </div>
        </div>

        {/* 0% Interest Plans */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              0% Interest
            </div>
            <div className="text-lg font-normal text-slate-900 dark:text-white mt-0.5">
              {metrics.zeroInterestPlans} <span className="text-xs font-normal text-slate-400">plans</span>
            </div>
          </div>
        </div>

        {/* Average Tenure */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Duration
            </div>
            <div className="text-lg font-normal text-rose-600 dark:text-rose-400 mt-0.5">
              {metrics.avgDuration} <span className="text-xs font-normal text-slate-400">months</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plan name, tenure..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Duration filter dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-normal text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-neutral-500 cursor-pointer transition-colors"
            >
              <option value="">All Tenures</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Installment Plans Table ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && plans.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
            <span className="text-xs font-normal">Loading installment plans...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-normal text-xs text-slate-700 dark:text-slate-300">No installment plans found</p>
            <p className="text-[11px] font-normal text-slate-400 mt-0.5">Click "+ Create Plan" to configure a financing tenure</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-normal">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Plan Name
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Tenure
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Interest Rate
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Additional Fee
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Est. Monthly ($1,000)
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-normal text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {plans.map((plan) => {
                  const rate = Number(plan.interest_rate || 0);
                  const fee = Number(plan.additional_fee || 0);
                  const sampleMonthly = calculateSampleMonthly(plan);

                  return (
                    <tr
                      key={plan.installment_plan_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap font-normal">
                        SKLABA_Plan_{plan.installment_plan_id}
                      </td>

                      {/* Plan Name */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {plan.plan_name}
                      </td>

                      {/* Tenure (Clean text in black, no blue text or bg) */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {plan.number_of_months} Months
                      </td>

                      {/* Interest Rate (Clean text in black, no green bg) */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        {rate === 0 ? '0.00% (Zero Interest)' : `${rate.toFixed(2)}%`}
                      </td>

                      {/* Additional Fee */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-normal">
                        {fee > 0 ? `$${fee.toFixed(2)}` : '—'}
                      </td>

                      {/* Est Monthly */}
                      <td className="px-4 py-3 font-normal text-slate-900 dark:text-slate-100">
                        ${sampleMonthly}/mo
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 font-normal">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(plan)}
                          className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity font-normal text-slate-900 dark:text-slate-100"
                          title="Click to toggle active/inactive"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              plan.is_active ? 'bg-slate-900 dark:bg-rose-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{plan.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailPlan(plan)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="p-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                            title="Edit plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingPlan(plan)}
                            className="p-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                            title="Delete plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: DELETE CONFIRMATION ─────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        onConfirm={() => handleDeletePlan(deletingPlan?.installment_plan_id)}
        title="Delete Installment Plan"
        subtitle="Remove financing terms"
        message={`Delete installment plan "${deletingPlan?.plan_name}"? Existing phones configured with this plan will no longer offer this financing option.`}
        confirmText="Delete Plan"
        loading={submitting}
      />
    </div>
  );
}
