import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBrands,
  addBrand,
  updateBrand,
  deleteBrand,
  findBrandById,
} from '../actions/brandActions';

export default function useBrands() {
  const dispatch = useDispatch();

  const {
    list: brands = [],
    loading: apiLoading = false,
    adding = false,
    updating = false,
    deleting = false,
    selected: selectedBrand = null,
    error = null,
  } = useSelector((state) => state.brands ?? {});

  const submitting = adding || updating || deleting;

  const [searchTerm, setSearchTerm] = useState('');
  const [findIdInput, setFindIdInput] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [detailBrand, setDetailBrand] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchBrands());
    showToast('Brand list refreshed');
  }, [dispatch, showToast]);

  const handleFindById = async (e) => {
    e?.preventDefault();
    const id = findIdInput.trim();
    if (!id) return;

    setIsFinding(true);
    const res = await dispatch(findBrandById(id));
    setIsFinding(false);

    if (res?.success && res.data) {
      setDetailBrand(res.data);
      showToast(`Brand #${id} found!`);
    } else {
      showToast(res?.error || `Brand #${id} not found`, 'error');
    }
  };

  const handleAddBrand = async (brandData) => {
    const res = await dispatch(addBrand(brandData));
    if (res?.success) {
      showToast(`Brand "${brandData.brand_name}" created successfully!`);
      setIsAddOpen(false);
    } else {
      showToast(res?.error || 'Failed to create brand', 'error');
    }
    return res;
  };

  const handleUpdateBrand = async (brandId, brandData) => {
    const res = await dispatch(updateBrand(brandId, brandData));
    if (res?.success) {
      showToast(`Brand #${brandId} updated successfully!`);
      setEditingBrand(null);
    } else {
      showToast(res?.error || 'Failed to update brand', 'error');
    }
    return res;
  };

  const handleDeleteBrand = async (brandId) => {
    const res = await dispatch(deleteBrand(brandId));
    if (res?.success) {
      showToast('Brand deleted successfully!');
      setDeletingBrand(null);
    } else {
      showToast(res?.error || 'Failed to delete brand', 'error');
    }
    return res;
  };

  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brands;
    const q = searchTerm.toLowerCase();
    return brands.filter(
      (b) =>
        b.brand_name?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        String(b.brand_id).includes(q)
    );
  }, [brands, searchTerm]);

  const totalCount = brands.length;
  const activeCount = brands.filter((b) => b.is_active === 1 || b.is_active === true).length;

  return {
    brands,
    filteredBrands,
    apiLoading,
    submitting,
    error,
    totalCount,
    activeCount,
    searchTerm,
    setSearchTerm,
    findIdInput,
    setFindIdInput,
    isFinding,
    isAddOpen,
    setIsAddOpen,
    editingBrand,
    setEditingBrand,
    detailBrand,
    setDetailBrand,
    deletingBrand,
    setDeletingBrand,
    toast,
    showToast,
    handleRefresh,
    handleFindById,
    handleAddBrand,
    handleUpdateBrand,
    handleDeleteBrand,
  };
}
