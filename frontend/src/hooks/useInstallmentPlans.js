import { useEffect, useState, useMemo, useCallback } from 'react';
import InstallmentPlanService from '../services/installmentPlanService';

export default function useInstallmentPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [detailPlan, setDetailPlan] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter === 'ACTIVE') filters.is_active = true;
      if (statusFilter === 'INACTIVE') filters.is_active = false;

      const res = await InstallmentPlanService.getPlans(filters);
      const data = res.data?.data || res.data || [];
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Load installment plans error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load installment plans');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleRefresh = useCallback(() => {
    loadPlans();
    showToast('Installment plans refreshed');
  }, [loadPlans, showToast]);

  const handleCreatePlan = async (data) => {
    setSubmitting(true);
    try {
      const res = await InstallmentPlanService.createPlan(data);
      const created = res.data?.data || res.data;
      showToast(`Plan "${data.plan_name}" created successfully!`);
      setIsAddOpen(false);
      await loadPlans();
      return { success: true, data: created };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create plan';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlan = async (id, data) => {
    setSubmitting(true);
    try {
      const res = await InstallmentPlanService.updatePlan(id, data);
      const updated = res.data?.data || res.data;
      showToast(`Plan #${id} updated successfully!`);
      setEditingPlan(null);
      await loadPlans();
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update plan';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    if (!plan?.installment_plan_id) return;
    try {
      const res = await InstallmentPlanService.togglePlanStatus(plan.installment_plan_id);
      const updated = res.data?.data || res.data;
      const newStatus = updated?.is_active ? 'Activated' : 'Deactivated';
      showToast(`"${plan.plan_name}" ${newStatus}`);
      await loadPlans();
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const handleDeletePlan = async (id) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await InstallmentPlanService.deletePlan(id);
      showToast('Installment plan deleted successfully');
      setDeletingPlan(null);
      await loadPlans();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete plan';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered by duration in frontend if specified
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const months = Number(p.number_of_months || 0);
      if (durationFilter === 'SHORT') return months <= 6;
      if (durationFilter === 'MEDIUM') return months > 6 && months <= 12;
      if (durationFilter === 'LONG') return months > 12;
      return true;
    });
  }, [plans, durationFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    let activeCount = 0;
    let zeroInterestCount = 0;
    let maxTenure = 0;

    plans.forEach((p) => {
      if (p.is_active) activeCount++;
      if (Number(p.interest_rate || 0) === 0) zeroInterestCount++;
      const m = Number(p.number_of_months || 0);
      if (m > maxTenure) maxTenure = m;
    });

    return {
      totalPlans: plans.length,
      activeCount,
      zeroInterestCount,
      maxTenure: maxTenure || 0,
    };
  }, [plans]);

  return {
    plans: filteredPlans,
    rawPlans: plans,
    loading,
    submitting,
    error,
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
    showToast,
    handleRefresh,
    handleCreatePlan,
    handleUpdatePlan,
    handleToggleStatus,
    handleDeletePlan,
  };
}

