import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPhones,
  addPhone,
  updatePhone,
  deletePhone,
  findPhoneById,
} from '../actions/phoneActions';
import { fetchBrands } from '../actions/brandActions';
import { fetchStorageOptions } from '../actions/storageActions';
import { fetchSpecifications } from '../actions/specificationActions';

export default function usePhones() {
  const dispatch = useDispatch();

  const {
    list: phones = [],
    loading: apiLoading = false,
    adding = false,
    updating = false,
    deleting = false,
    selected = null,
    error = null,
  } = useSelector((state) => state.phones ?? {});

  const { list: brands = [] } = useSelector((state) => state.brands ?? {});
  const { list: storageOptions = [] } = useSelector((state) => state.storage ?? {});
  const { list: specifications = [] } = useSelector((state) => state.specifications ?? {});

  const submitting = adding || updating || deleting;

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [findIdInput, setFindIdInput] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [detailPhone, setDetailPhone] = useState(null);
  const [deletingPhone, setDeletingPhone] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadPhones = useCallback(() => {
    dispatch(
      fetchPhones({
        search: searchTerm || undefined,
        brand_id: brandFilter || undefined,
        status: statusFilter || undefined,
        phone_condition: conditionFilter || undefined,
        availability: availabilityFilter || undefined,
      })
    );
  }, [dispatch, searchTerm, brandFilter, statusFilter, conditionFilter, availabilityFilter]);

  useEffect(() => {
    loadPhones();
  }, [loadPhones]);

  useEffect(() => {
    dispatch(fetchBrands());
    dispatch(fetchStorageOptions());
    dispatch(fetchSpecifications());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    loadPhones();
    showToast('Phones inventory refreshed');
  }, [loadPhones, showToast]);

  const handleFindById = async (e) => {
    e?.preventDefault();
    const id = findIdInput.trim();
    if (!id) return;

    setIsFinding(true);
    const res = await dispatch(findPhoneById(id));
    setIsFinding(false);

    if (res?.success && res.data) {
      setDetailPhone(res.data);
      showToast(`Phone #${id} found!`);
    } else {
      showToast(res?.error || `Phone #${id} not found`, 'error');
    }
  };

  const handleAddPhone = async (data) => {
    const res = await dispatch(addPhone(data));
    if (res?.success) {
      showToast(`Phone "${data.name}" added to inventory!`);
      setIsAddOpen(false);
    } else {
      showToast(res?.error || 'Failed to add phone', 'error');
    }
    return res;
  };

  const handleUpdatePhone = async (id, data) => {
    const res = await dispatch(updatePhone(id, data));
    if (res?.success) {
      showToast(`Phone #${id} updated successfully!`);
      setEditingPhone(null);
    } else {
      showToast(res?.error || 'Failed to update phone', 'error');
    }
    return res;
  };

  const handleDeletePhone = async (id) => {
    const res = await dispatch(deletePhone(id));
    if (res?.success) {
      showToast('Phone deleted successfully!');
      setDeletingPhone(null);
    } else {
      showToast(res?.error || 'Failed to delete phone', 'error');
    }
    return res;
  };

  const publishedCount = phones.filter((p) => p.status === 'PUBLISHED').length;
  const inStockCount = phones.filter((p) => p.availability === 'IN_STOCK').length;

  return {
    phones,
    brands,
    storageOptions,
    specifications,
    apiLoading,
    submitting,
    error,
    totalCount: phones.length,
    publishedCount,
    inStockCount,
    searchTerm,
    setSearchTerm,
    brandFilter,
    setBrandFilter,
    statusFilter,
    setStatusFilter,
    conditionFilter,
    setConditionFilter,
    availabilityFilter,
    setAvailabilityFilter,
    findIdInput,
    setFindIdInput,
    isFinding,
    isAddOpen,
    setIsAddOpen,
    editingPhone,
    setEditingPhone,
    detailPhone,
    setDetailPhone,
    deletingPhone,
    setDeletingPhone,
    toast,
    showToast,
    handleRefresh,
    handleFindById,
    handleAddPhone,
    handleUpdatePhone,
    handleDeletePhone,
  };
}
