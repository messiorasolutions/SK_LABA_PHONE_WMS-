import { useEffect, useState, useMemo, useCallback } from 'react';
import OfferService from '../services/offerService';
import PhoneService from '../services/phoneService';

export default function useOffers() {
  const [offers, setOffers] = useState([]);
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [detailOffer, setDetailOffer] = useState(null);
  const [deletingOffer, setDeletingOffer] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (stageFilter) filters.stage = stageFilter;

      const res = await OfferService.getOffers(filters);
      const data = res.data?.data || res.data || [];
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Load offers error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stageFilter]);

  const loadPhones = useCallback(async () => {
    try {
      const res = await PhoneService.getPhones({ include_archived: false });
      const data = res.data?.data || res.data || [];
      setPhones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Load phones error in useOffers:', err);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    loadPhones();
  }, [loadPhones]);

  const handleRefresh = useCallback(() => {
    loadOffers();
    loadPhones();
    showToast('Offers catalogue refreshed');
  }, [loadOffers, loadPhones, showToast]);

  const handleCreateOffer = async (data) => {
    setSubmitting(true);
    try {
      const res = await OfferService.createOffer(data);
      const created = res.data?.data || res.data;
      showToast(`Offer "${data.title}" created successfully!`);
      setIsAddOpen(false);
      await loadOffers();
      return { success: true, data: created };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create offer';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOffer = async (id, data) => {
    setSubmitting(true);
    try {
      const res = await OfferService.updateOffer(id, data);
      const updated = res.data?.data || res.data;
      showToast(`Offer #${id} updated successfully!`);
      setEditingOffer(null);
      await loadOffers();
      return { success: true, data: updated };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update offer';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await OfferService.deleteOffer(id);
      showToast('Offer deleted successfully');
      setDeletingOffer(null);
      await loadOffers();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete offer';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    let activeCount = 0;
    let upcomingCount = 0;
    let endedCount = 0;
    let draftCount = 0;
    let maxDiscount = 0;

    offers.forEach((o) => {
      const stage = o.stage || (o.status === 'DRAFT' ? 'DRAFT' : 'ACTIVE');
      if (stage === 'ACTIVE') activeCount++;
      else if (stage === 'UPCOMING') upcomingCount++;
      else if (stage === 'ENDED') endedCount++;
      else if (stage === 'DRAFT' || o.status === 'DRAFT') draftCount++;

      const discPct = Number(o.discount_percentage || 0);
      if (discPct > maxDiscount) maxDiscount = discPct;
    });

    return {
      totalOffers: offers.length,
      activeCount,
      upcomingCount,
      endedCount,
      draftCount,
      maxDiscount,
    };
  }, [offers]);

  return {
    offers,
    phones,
    loading,
    submitting,
    error,
    metrics,
    searchTerm,
    setSearchTerm,
    stageFilter,
    setStageFilter,
    isAddOpen,
    setIsAddOpen,
    editingOffer,
    setEditingOffer,
    detailOffer,
    setDetailOffer,
    deletingOffer,
    setDeletingOffer,
    toast,
    showToast,
    handleRefresh,
    handleCreateOffer,
    handleUpdateOffer,
    handleDeleteOffer,
  };
}
