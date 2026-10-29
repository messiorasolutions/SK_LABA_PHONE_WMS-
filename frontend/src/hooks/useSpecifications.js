import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSpecifications,
  addSpecification,
  updateSpecification,
  deleteSpecification,
  findSpecificationById,
} from '../actions/specificationActions';

export default function useSpecifications() {
  const dispatch = useDispatch();

  const {
    list: specifications = [],
    loading: apiLoading = false,
    adding = false,
    updating = false,
    deleting = false,
    selected = null,
    error = null,
  } = useSelector((state) => state.specifications ?? {});

  const submitting = adding || updating || deleting;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [findIdInput, setFindIdInput] = useState('');
  const [isFinding, setIsFinding] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [detailSpec, setDetailSpec] = useState(null);
  const [deletingSpec, setDeletingSpec] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    dispatch(fetchSpecifications(typeFilter));
  }, [dispatch, typeFilter]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchSpecifications(typeFilter));
    showToast('Specifications list refreshed');
  }, [dispatch, typeFilter, showToast]);

  const handleFindById = async (e) => {
    e?.preventDefault();
    const id = findIdInput.trim();
    if (!id) return;

    setIsFinding(true);
    const res = await dispatch(findSpecificationById(id));
    setIsFinding(false);

    if (res?.success && res.data) {
      setDetailSpec(res.data);
      showToast(`Specification #${id} found!`);
    } else {
      showToast(res?.error || `Specification #${id} not found`, 'error');
    }
  };

  const handleAddSpec = async (data) => {
    const res = await dispatch(addSpecification(data));
    if (res?.success) {
      showToast(`Specification created successfully!`);
      setIsAddOpen(false);
    } else {
      showToast(res?.error || 'Failed to create specification', 'error');
    }
    return res;
  };

  const handleUpdateSpec = async (id, data) => {
    const res = await dispatch(updateSpecification(id, data));
    if (res?.success) {
      showToast(`Specification #${id} updated successfully!`);
      setEditingSpec(null);
    } else {
      showToast(res?.error || 'Failed to update specification', 'error');
    }
    return res;
  };

  const handleDeleteSpec = async (id) => {
    const res = await dispatch(deleteSpecification(id));
    if (res?.success) {
      showToast('Specification deleted successfully!');
      setDeletingSpec(null);
    } else {
      showToast(res?.error || 'Failed to delete specification', 'error');
    }
    return res;
  };

  const filteredSpecs = useMemo(() => {
    return specifications.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.specification_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.specification_id).includes(searchTerm);

      const matchesType = !typeFilter || s.specification_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [specifications, searchTerm, typeFilter]);

  const technicalCount = specifications.filter((s) => s.specification_type === 'TECHNICAL').length;
  const accessoryCount = specifications.filter((s) => s.specification_type === 'ACCESSORY').length;

  return {
    specifications,
    filteredSpecs,
    apiLoading,
    submitting,
    error,
    totalCount: specifications.length,
    technicalCount,
    accessoryCount,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    findIdInput,
    setFindIdInput,
    isFinding,
    isAddOpen,
    setIsAddOpen,
    editingSpec,
    setEditingSpec,
    detailSpec,
    setDetailSpec,
    deletingSpec,
    setDeletingSpec,
    toast,
    showToast,
    handleRefresh,
    handleFindById,
    handleAddSpec,
    handleUpdateSpec,
    handleDeleteSpec,
  };
}
