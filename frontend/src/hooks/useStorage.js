import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStorageOptions,
  addStorageOption,
  updateStorageOption,
  deleteStorageOption,
  findStorageOptionById,
} from '../actions/storageActions';

export default function useStorage() {
  const dispatch = useDispatch();

  const {
    list: storageOptions = [],
    loading: apiLoading = false,
    adding = false,
    updating = false,
    deleting = false,
    selected = null,
    error = null,
  } = useSelector((state) => state.storage ?? {});

  const submitting = adding || updating || deleting;

  const [searchTerm, setSearchTerm] = useState('');
  const [findIdInput, setFindIdInput] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStorage, setEditingStorage] = useState(null);
  const [detailStorage, setDetailStorage] = useState(null);
  const [deletingStorage, setDeletingStorage] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    dispatch(fetchStorageOptions());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchStorageOptions());
    showToast('Storage list refreshed');
  }, [dispatch, showToast]);

  const handleFindById = async (e) => {
    e?.preventDefault();
    const id = findIdInput.trim();
    if (!id) return;

    setIsFinding(true);
    const res = await dispatch(findStorageOptionById(id));
    setIsFinding(false);

    if (res?.success && res.data) {
      setDetailStorage(res.data);
      showToast(`Storage #${id} found!`);
    } else {
      showToast(res?.error || `Storage #${id} not found`, 'error');
    }
  };

  const handleAddStorage = async (data) => {
    const res = await dispatch(addStorageOption(data));
    if (res?.success) {
      showToast(`Storage "${data.storage_name}" created successfully!`);
      setIsAddOpen(false);
    } else {
      showToast(res?.error || 'Failed to create storage option', 'error');
    }
    return res;
  };

  const handleUpdateStorage = async (id, data) => {
    const res = await dispatch(updateStorageOption(id, data));
    if (res?.success) {
      showToast(`Storage #${id} updated successfully!`);
      setEditingStorage(null);
    } else {
      showToast(res?.error || 'Failed to update storage option', 'error');
    }
    return res;
  };

  const handleDeleteStorage = async (id) => {
    const res = await dispatch(deleteStorageOption(id));
    if (res?.success) {
      showToast('Storage option deleted successfully!');
      setDeletingStorage(null);
    } else {
      showToast(res?.error || 'Failed to delete storage option', 'error');
    }
    return res;
  };

  const filteredStorage = useMemo(() => {
    if (!searchTerm.trim()) return storageOptions;
    const q = searchTerm.toLowerCase();
    return storageOptions.filter(
      (s) =>
        s.storage_name?.toLowerCase().includes(q) ||
        String(s.capacity_gb).includes(q) ||
        String(s.storage_id).includes(q)
    );
  }, [storageOptions, searchTerm]);

  return {
    storageOptions,
    filteredStorage,
    apiLoading,
    submitting,
    error,
    totalCount: storageOptions.length,
    searchTerm,
    setSearchTerm,
    findIdInput,
    setFindIdInput,
    isFinding,
    isAddOpen,
    setIsAddOpen,
    editingStorage,
    setEditingStorage,
    detailStorage,
    setDetailStorage,
    deletingStorage,
    setDeletingStorage,
    toast,
    showToast,
    handleRefresh,
    handleFindById,
    handleAddStorage,
    handleUpdateStorage,
    handleDeleteStorage,
  };
}
