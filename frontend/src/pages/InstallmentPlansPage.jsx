import React from 'react';
import useInstallmentPlans from '../hooks/useInstallmentPlans';
import InstallmentPlanModal from '../components/Modals/InstallmentPlanModal';
import InstallmentDetailModal from '../components/Modals/InstallmentDetailModal';
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

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl animate-in slide-in-from-top-2">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Installment Plans Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure monthly financing tenures, interest rates, and customer terms (SRS MG-11)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
            title="Refresh plans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Plans */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Plans
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics.totalPlans} <span className="text-xs font-normal text-slate-400">plans</span>
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Plans
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.activeCount} <span className="text-xs font-normal text-slate-400">active</span>
            </div>
          </div>
        </div>

        {/* 0% Interest Promos */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              0% Interest
            </div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {metrics.zeroInterestCount} <span className="text-xs font-normal text-slate-400">promos</span>
            </div>
          </div>
        </div>

        {/* Max Tenure */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Max Tenure
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.maxTenure} <span className="text-xs font-normal text-slate-400">months</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search plan name, terms..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="relative min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Duration filter */}
          <div className="relative min-w-[150px]">
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer transition-colors"
            >
              <option value="">All Durations</option>
              <option value="SHORT">Short-Term (≤ 6 Months)</option>
              <option value="MEDIUM">Mid-Term (7–12 Months)</option>
              <option value="LONG">Long-Term (&gt; 12 Months)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── 4. Plans Table ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading && plans.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span className="text-xs font-semibold">Loading installment plans...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">No installment plans found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Create Plan" to set up financing options</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] w-36">
                    ID
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Plan Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Tenure
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Interest Rate
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Additional Fee
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Est. Monthly ($1,000)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] text-right">
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
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        SKLABA_Plan_{plan.installment_plan_id}
                      </td>

                      {/* Plan Name */}
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {plan.plan_name}
                      </td>

                      {/* Tenure */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#2563EB] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md">
                          {plan.number_of_months} Mos
                        </span>
                      </td>

                      {/* Interest Rate */}
                      <td className="px-4 py-3">
                        {rate === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Percent className="w-2.5 h-2.5" />
                            <span>0% Zero Interest</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {rate.toFixed(2)}%
                          </span>
                        )}
                      </td>

                      {/* Additional Fee */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {fee > 0 ? `$${fee.toFixed(2)}` : '—'}
                      </td>

                      {/* Est Monthly */}
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        ${sampleMonthly}/mo
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(plan)}
                          className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                          title="Click to toggle active/inactive"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              plan.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              plan.is_active
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailPlan(plan)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingPlan(plan)}
                            className="p-1.5 border border-red-100 dark:border-red-950/60 text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
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

      {/* ── MODALS: CREATE & EDIT ──────────────────────────────────── */}
      <InstallmentPlanModal
        isOpen={isAddOpen || Boolean(editingPlan)}
        onClose={() => {
          setIsAddOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={
          editingPlan
            ? (data) => handleUpdatePlan(editingPlan.installment_plan_id, data)
            : handleCreatePlan
        }
        initial={editingPlan}
        loading={submitting}
      />

      {/* ── MODAL: VIEW DETAILS ────────────────────────────────────── */}
      <InstallmentDetailModal
        isOpen={Boolean(detailPlan)}
        onClose={() => setDetailPlan(null)}
        plan={detailPlan}
      />

      {/* ── MODAL: DELETE CONFIRMATION ─────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingPlan)}
        onClose={() => setDeletingPlan(null)}
        onConfirm={() => handleDeletePlan(deletingPlan?.installment_plan_id)}
        title="Delete Installment Plan"
        subtitle="Remove from financing options"
        message={`Delete installment plan "${deletingPlan?.plan_name}"? Phones configured with this plan will no longer offer it to customers.`}
        confirmText="Delete Plan"
        loading={submitting}
      />
    </div>
  );
}

