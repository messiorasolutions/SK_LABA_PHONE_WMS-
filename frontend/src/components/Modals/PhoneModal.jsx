import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Shield,
  Tag,
  Layers,
  FileText,
  ChevronDown,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  HardDrive,
  Bold,
  Italic,
  List,
  ListOrdered,
  Eye,
  EyeOff,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';
import InstallmentPlanService from '../../services/installmentPlanService';
import StorageService from '../../services/storageService';

const STORAGE_PRESETS = [
  { name: '64GB', capacity_gb: 64 },
  { name: '128GB', capacity_gb: 128 },
  { name: '256GB', capacity_gb: 256 },
  { name: '512GB', capacity_gb: 512 },
  { name: '1TB', capacity_gb: 1024 },
];

const COLOR_PRESETS = [
  { name: 'Natural Titanium', color_code: '#94A3B8' },
  { name: 'Black Titanium', color_code: '#1E293B' },
  { name: 'White Titanium', color_code: '#F8FAFC' },
  { name: 'Blue Titanium', color_code: '#2563EB' },
  { name: 'Awesome Graphite', color_code: '#374151' },
  { name: 'Awesome Lime', color_code: '#84CC16' },
  { name: 'Awesome Violet', color_code: '#8B5CF6' },
  { name: 'Phantom Black', color_code: '#0F172A' },
  { name: 'Cream / Gold', color_code: '#FEF08A' },
  { name: 'Silver', color_code: '#E2E8F0' },
];

/**
 * Compresses an image file client-side into a high quality JPEG DataURL
 */
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = () => resolve('');
  });
};

export default function PhoneModal({
  isOpen,
  onClose,
  onSubmit,
  initial = null,
  loading = false,
  brands = [],
  storageOptions = [],
  specifications = [],
}) {
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [phoneCondition, setPhoneCondition] = useState('NEW');
  const [price, setPrice] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [status, setStatus] = useState('PUBLISHED');
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [descPreview, setDescPreview] = useState(false);
  const descRef = useRef(null);

  const handleApplyFormat = (type) => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = description.substring(start, end);

    let inserted = '';
    let nextPos = start;

    if (type === 'bold') {
      if (selected) {
        inserted = `**${selected}**`;
        nextPos = start + inserted.length;
      } else {
        inserted = '**Bold Text**';
        nextPos = start + 2;
      }
      const newDesc = description.substring(0, start) + inserted + description.substring(end);
      setDescription(newDesc);
    } else if (type === 'italic') {
      if (selected) {
        inserted = `*${selected}*`;
        nextPos = start + inserted.length;
      } else {
        inserted = '*Italic Text*';
        nextPos = start + 1;
      }
      const newDesc = description.substring(0, start) + inserted + description.substring(end);
      setDescription(newDesc);
    } else if (type === 'bullet') {
      if (selected) {
        inserted = selected
          .split('\n')
          .map((line) => (line.startsWith('• ') ? line : `• ${line}`))
          .join('\n');
        nextPos = start + inserted.length;
      } else {
        const needsNewline = start > 0 && description[start - 1] !== '\n';
        inserted = needsNewline ? '\n• ' : '• ';
        nextPos = start + inserted.length;
      }
      const newDesc = description.substring(0, start) + inserted + description.substring(end);
      setDescription(newDesc);
    } else if (type === 'number') {
      if (selected) {
        inserted = selected
          .split('\n')
          .map((line, idx) => `${idx + 1}. ${line.replace(/^\d+[\.\)]\s*/, '')}`)
          .join('\n');
        nextPos = start + inserted.length;
      } else {
        const needsNewline = start > 0 && description[start - 1] !== '\n';
        inserted = needsNewline ? '\n1. ' : '1. ';
        nextPos = start + inserted.length;
      }
      const newDesc = description.substring(0, start) + inserted + description.substring(end);
      setDescription(newDesc);
    }

    setTimeout(() => {
      if (descRef.current) {
        descRef.current.focus();
        descRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };
  
  // Mandatory Storage Options (SRS ST-01)
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const [localStorages, setLocalStorages] = useState(storageOptions);
  const [showAddStorageForm, setShowAddStorageForm] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newCapacityGb, setNewCapacityGb] = useState('');
  const [creatingStorage, setCreatingStorage] = useState(false);

  useEffect(() => {
    setLocalStorages(storageOptions);
  }, [storageOptions]);

  // Mandatory Color options with 1-3 photos per color
  const [colors, setColors] = useState([]);
  
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch active installment plans for selection (SRS ST-02)
  useEffect(() => {
    if (isOpen) {
      InstallmentPlanService.getPlans({ is_active: true })
        .then((res) => {
          const data = res.data?.data || res.data || [];
          setAvailablePlans(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setBrandId(initial.brand_id || '');
      setPhoneCondition(initial.phone_condition || 'NEW');
      setPrice(initial.price || '');
      setLowStockLevel(initial.low_stock_level ?? initial.stock_quantity ?? '');
      setAvailability(initial.availability || 'IN_STOCK');
      setStatus(initial.status || 'PUBLISHED');
      setWarranty(initial.warranty || '');
      setDescription(initial.description || '');

      // Parse colors & photos
      let initialColors = [];
      let rawColors = initial.colour_options;
      if (typeof rawColors === 'string') {
        try {
          rawColors = JSON.parse(rawColors);
        } catch {
          rawColors = rawColors.split(',').map((c) => c.trim()).filter(Boolean);
        }
      }

      if (Array.isArray(rawColors) && rawColors.length > 0) {
        initialColors = rawColors.map((c, i) => {
          if (typeof c === 'string') {
            return {
              id: String(Date.now() + i),
              name: c,
              color_code: '#374151',
              photos: i === 0 && Array.isArray(initial.photos) ? initial.photos.slice(0, 3) : [],
            };
          }
          return {
            id: String(Date.now() + i),
            name: c.color_name || c.name || '',
            color_code: c.color_code || c.color || c.hex || '#374151',
            photos: Array.isArray(c.photos) ? c.photos.slice(0, 3) : [],
          };
        });
      } else {
        initialColors = [
          {
            id: '1',
            name: 'Natural Titanium',
            color_code: '#94A3B8',
            photos: Array.isArray(initial.photos) ? initial.photos.slice(0, 3) : [],
          },
        ];
      }
      setColors(initialColors);

      setInstallmentEnabled(Boolean(initial.installment_enabled));

      let initPlanIds = [];
      if (Array.isArray(initial.installment_plan_ids)) {
        initPlanIds = initial.installment_plan_ids;
      } else if (typeof initial.installment_plan_ids === 'string') {
        try {
          initPlanIds = JSON.parse(initial.installment_plan_ids);
        } catch {
          initPlanIds = [];
        }
      }
      setSelectedPlanIds(initPlanIds);
      setShowMoreDetails(Boolean(initial.warranty || initial.installment_enabled));

      let initStorageIds = [];
      if (Array.isArray(initial.storage_ids)) {
        initStorageIds = initial.storage_ids;
      } else if (typeof initial.storage_ids === 'string') {
        try {
          initStorageIds = JSON.parse(initial.storage_ids);
        } catch {
          initStorageIds = [];
        }
      } else if (Array.isArray(initial.storage_options)) {
        initStorageIds = initial.storage_options.map((s) => s.storage_id);
      }
      setSelectedStorageIds(initStorageIds);
    } else {
      setName('');
      setBrandId(brands[0]?.brand_id || '');
      setPhoneCondition('NEW');
      setPrice('');
      setLowStockLevel('');
      setAvailability('IN_STOCK');
      setStatus('PUBLISHED');
      setWarranty('');
      setDescription('');
      setColors([
        {
          id: '1',
          name: 'Natural Titanium',
          color_code: '#94A3B8',
          photos: [],
        },
      ]);
      setInstallmentEnabled(false);
      setSelectedPlanIds([]);
      setShowMoreDetails(false);
      setSelectedStorageIds(storageOptions.length > 0 ? [storageOptions[0].storage_id] : []);
    }
    setSubmitError('');
  }, [initial, isOpen, brands, storageOptions]);

  if (!isOpen) return null;

  // Create a new storage option on the fly
  const handleCreateStorage = async (name, capacity) => {
    const sName = (name || newStorageName).trim();
    const sCap = Number(capacity || newCapacityGb);
    if (!sName || !sCap || sCap <= 0) {
      alert('Please provide a valid Storage Name (e.g. 512GB) and Capacity in GB (e.g. 512).');
      return;
    }

    const existing = localStorages.find((s) => s.storage_name.toLowerCase() === sName.toLowerCase());
    if (existing) {
      if (!selectedStorageIds.includes(existing.storage_id)) {
        setSelectedStorageIds((prev) => [...prev, existing.storage_id]);
      }
      setShowAddStorageForm(false);
      return;
    }

    setCreatingStorage(true);
    try {
      const res = await StorageService.createStorageOption({
        storage_name: sName,
        capacity_gb: sCap,
        storage_type: 'Internal UFS',
        is_active: true,
      });
      const created = res.data?.data || res.data;
      if (created?.storage_id) {
        setLocalStorages((prev) => [...prev, created]);
        setSelectedStorageIds((prev) => [...prev, created.storage_id]);
        setShowAddStorageForm(false);
        setNewStorageName('');
        setNewCapacityGb('');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create storage option');
    } finally {
      setCreatingStorage(false);
    }
  };

  // Toggle storage option selection
  const handleToggleStorage = (id) => {
    setSelectedStorageIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Add a new color slot
  const handleAddColorSlot = (preset) => {
    const newColor = {
      id: String(Date.now() + Math.random()),
      name: preset ? preset.name : '',
      color_code: preset ? preset.color_code : '#3B82F6',
      photos: [],
    };
    setColors((prev) => [...prev, newColor]);
  };

  // Remove a color slot
  const handleRemoveColorSlot = (id) => {
    if (colors.length <= 1) {
      setSubmitError('At least one color option is mandatory.');
      return;
    }
    setColors((prev) => prev.filter((c) => c.id !== id));
  };

  // Update color name
  const handleColorNameChange = (id, newName) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  // Update color code (hex)
  const handleColorCodeChange = (id, newCode) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color_code: newCode } : c))
    );
  };

  // Handle image upload for a specific color (Max 3, Min 1)
  const handleUploadPhotos = async (colorId, files) => {
    if (!files || files.length === 0) return;
    const color = colors.find((c) => c.id === colorId);
    if (!color) return;

    const remainingSlots = 3 - (color.photos ? color.photos.length : 0);
    if (remainingSlots <= 0) {
      alert('Maximum of 3 photos allowed for this color.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const compressedList = [];
    for (const file of filesToUpload) {
      const dataUrl = await compressImage(file);
      if (dataUrl) compressedList.push(dataUrl);
    }

    setColors((prev) =>
      prev.map((c) => {
        if (c.id === colorId) {
          const updatedPhotos = [...(c.photos || []), ...compressedList].slice(0, 3);
          return { ...c, photos: updatedPhotos };
        }
        return c;
      })
    );
  };

  // Remove a photo from a color
  const handleRemovePhoto = (colorId, photoIdx) => {
    setColors((prev) =>
      prev.map((c) => {
        if (c.id === colorId) {
          const updatedPhotos = c.photos.filter((_, idx) => idx !== photoIdx);
          return { ...c, photos: updatedPhotos };
        }
        return c;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !brandId || !price) {
      setSubmitError('Phone Model, Brand, and Price are required.');
      return;
    }

    // Mandatory storage validation
    if (!selectedStorageIds || selectedStorageIds.length === 0) {
      setSubmitError('At least one storage option is mandatory.');
      return;
    }

    // Mandatory color validation
    if (!colors || colors.length === 0) {
      setSubmitError('At least one color option is mandatory.');
      return;
    }

    for (const c of colors) {
      if (!c.name.trim()) {
        setSubmitError('Please enter a color name for all added colors.');
        return;
      }
      if (!c.photos || c.photos.length === 0) {
        setSubmitError(
          `At least 1 photo is mandatory for color "${c.name.trim()}". (You can upload up to 3 photos).`
        );
        return;
      }
      if (c.photos.length > 3) {
        setSubmitError(`Maximum of 3 photos allowed for color "${c.name.trim()}".`);
        return;
      }
    }

    // Format colour_options and photos
    const formattedColourOptions = colors.map((c) => ({
      name: c.name.trim(),
      color_name: c.name.trim(),
      color_code: c.color_code || '#374151',
      photos: c.photos.slice(0, 3),
    }));

    // Combined all photos starting with color 1's photos
    const allPhotos = colors.flatMap((c) => c.photos || []).filter(Boolean);

    const payload = {
      name: name.trim(),
      brand_id: Number(brandId),
      phone_condition: phoneCondition,
      price: Number(price),
      low_stock_level: Number(lowStockLevel) || 0,
      stock_quantity: Number(lowStockLevel) || 0,
      availability,
      status,
      warranty: warranty.trim(),
      description: description.trim(),
      installment_enabled: installmentEnabled,
      installment_plan_ids: installmentEnabled ? selectedPlanIds : [],
      storage_ids: selectedStorageIds,
      colour_options: formattedColourOptions,
      photos: allPhotos,
    };

    const res = await onSubmit(payload);
    if (!res?.success && res?.error) {
      setSubmitError(res.error);
    }
  };

  return (
    <>
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[500px] md:w-[540px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {initial ? 'Edit Phone' : 'Create Phone'}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {initial ? `Update SKLABA_Phone_${initial.phone_id} details` : 'Add a new phone with color options & photos'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Container with pinned footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-4 [scrollbar-width:thin] scrollbar-thin">
            {/* 1. Phone Model */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Model <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samsung Galaxy A54 5G"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
                />
              </div>
            </div>

            {/* 2. Brand & Condition */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    required
                    className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.brand_id} value={b.brand_id}>
                        {b.brand_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condition <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={phoneCondition}
                    onChange={(e) => setPhoneCondition(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="NEW">New</option>
                    <option value="USED">Used</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 3. Price & Low Stock Level */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1199.99"
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockLevel}
                  onChange={(e) => setLowStockLevel(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            {/* 4. Availability & Status */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Availability
                </label>
                <div className="relative">
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="SOLD_OUT">Sold Out</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Storage Options (Mandatory) */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Storage Options</span>
                    <span className="text-red-500 font-bold">*</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Select internal storage capacities for this model. (Mandatory)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {selectedStorageIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddStorageForm((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Storage</span>
                  </button>
                </div>
              </div>

              {/* Quick Storage Preset Chips */}
              <div>
                <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                  Quick storage presets (click to add & select):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STORAGE_PRESETS.map((preset) => {
                    const matched = localStorages.find(
                      (s) => s.storage_name.toLowerCase() === preset.name.toLowerCase()
                    );
                    const isSelected = matched && selectedStorageIds.includes(matched.storage_id);

                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          if (matched) {
                            handleToggleStorage(matched.storage_id);
                          } else {
                            handleCreateStorage(preset.name, preset.capacity_gb);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{preset.name}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inline Custom Storage Creator */}
              {showAddStorageForm && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 space-y-2.5 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Create Custom Storage Option
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        Storage Name
                      </label>
                      <input
                        type="text"
                        value={newStorageName}
                        onChange={(e) => setNewStorageName(e.target.value)}
                        placeholder="e.g. 512GB"
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        Capacity (GB)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newCapacityGb}
                        onChange={(e) => setNewCapacityGb(e.target.value)}
                        placeholder="e.g. 512"
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddStorageForm(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={creatingStorage}
                      onClick={() => handleCreateStorage()}
                      className="px-3 py-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {creatingStorage ? 'Creating...' : 'Save & Select'}
                    </button>
                  </div>
                </div>
              )}

              {/* Storage Selection Tiles */}
              {localStorages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {localStorages.map((s) => {
                    const isSelected = selectedStorageIds.includes(s.storage_id);
                    return (
                      <button
                        key={s.storage_id}
                        type="button"
                        onClick={() => handleToggleStorage(s.storage_id)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{s.storage_name}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  No storage options found. Use the quick presets above or click "Add Storage" to create one.
                </div>
              )}
            </div>

            {/* 5. ── MANDATORY COLOR SELECTION & PHOTO UPLOAD PER COLOR ── */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Colors & Photos</span>
                    <span className="text-red-500 font-bold">*</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Color selection is mandatory. Upload 1 to 3 photos for each color.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddColorSlot(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Color</span>
                </button>
              </div>

              {/* Quick color preset chips */}
              <div>
                <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                  Quick color presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => {
                    const alreadyAdded = colors.some(
                      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          if (!alreadyAdded) {
                            handleAddColorSlot(preset);
                          }
                        }}
                        disabled={alreadyAdded}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent cursor-not-allowed text-slate-400'
                            : 'bg-white dark:bg-slate-800 hover:border-blue-400 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: preset.color_code }}
                        />
                        <span>{preset.name}</span>
                        {alreadyAdded && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List of Color Cards */}
              <div className="space-y-3 pt-1">
                {colors.map((color, colorIdx) => {
                  const photoCount = color.photos ? color.photos.length : 0;
                  const canUploadMore = photoCount < 3;

                  return (
                    <div
                      key={color.id || colorIdx}
                      className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5"
                    >
                      {/* Color Header: Swatch + Color Name + Remove */}
                      <div className="flex items-center gap-2">
                        {/* Swatch color picker */}
                        <div className="relative shrink-0" title="Click to choose color code">
                          <input
                            type="color"
                            value={color.color_code || '#3B82F6'}
                            onChange={(e) => handleColorCodeChange(color.id, e.target.value)}
                            className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-700"
                          />
                        </div>

                        {/* Color Name Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => handleColorNameChange(color.id, e.target.value)}
                            placeholder="Color name, e.g. Natural Titanium"
                            required
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        {/* Remove Color Button */}
                        {colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColorSlot(color.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer shrink-0"
                            title="Remove this color"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Photo Upload Section for this Color */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <span>Photos ({photoCount}/3)</span>
                            <span className="text-red-500 font-bold">*</span>
                          </span>

                          {photoCount === 0 ? (
                            <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-red-200/50 dark:border-red-900/50">
                              At least 1 photo required
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                              ✓ {photoCount} of 3 photos added
                            </span>
                          )}
                        </div>

                        {/* Photo Previews + Upload Slot Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Render existing photos */}
                          {color.photos &&
                            color.photos.map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                className="relative aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden group/photo shadow-2xs"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`${color.name} ${pIdx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(color.id, pIdx)}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Delete photo"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <span className="absolute bottom-1 left-1 px-1 py-0.2 text-[9px] font-bold rounded bg-black/60 text-white">
                                  #{pIdx + 1}
                                </span>
                              </div>
                            ))}

                          {/* Upload Slot Button (up to 3) */}
                          {canUploadMore && (
                            <label className="relative aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-slate-500 dark:text-slate-400 hover:text-blue-600">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                onChange={(e) => {
                                  handleUploadPhotos(color.id, e.target.files);
                                  e.target.value = '';
                                }}
                                className="hidden"
                              />
                              <Upload className="w-4 h-4" />
                              <span className="text-[10px] font-semibold text-center leading-tight">
                                Upload Photo
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                (Max 3)
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Description with Rich Formatting Toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Description & Specifications
                </label>

                {/* Toolbar buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyFormat('bold')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Bold (**text**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFormat('italic')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Italic (*text*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFormat('bullet')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Bullet List (• item)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFormat('number')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => setDescPreview(!descPreview)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded font-medium transition-colors ${
                      descPreview
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                    title="Toggle Live Formatting Preview"
                  >
                    {descPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{descPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
              </div>

              {descPreview ? (
                <div className="w-full min-h-[90px] p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                  {description ? (
                    <FormattedDescription content={description} />
                  ) : (
                    <span className="text-slate-400 italic">No description entered yet.</span>
                  )}
                </div>
              ) : (
                <textarea
                  ref={descRef}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="• **Display:** 6.4-inch Super AMOLED 120Hz&#10;• **Camera:** 50MP OIS Triple Camera&#10;• **Battery:** *5000mAh* All-day battery"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] font-mono leading-relaxed"
                />
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Tip: Use toolbar to format with <strong>bold</strong>, <em>italic</em>, • bullet points, or numbers. Exactly same style displays on website.
              </p>
            </div>

            {/* Additional Options Accordion Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{showMoreDetails ? '- Hide Additional Options' : '+ Show Additional Options (Warranty, Financing)'}</span>
              </button>
            </div>

            {/* Additional Options */}
            {showMoreDetails && (
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                {/* Warranty */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warranty
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 1 Year Manufacturer Warranty"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                  />
                </div>

                {/* Installment Toggle (SRS ST-02) */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Enable Installment Plans
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Allow customers to purchase with monthly financing
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={installmentEnabled}
                      onChange={(e) => setInstallmentEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Select specific installment plans (SRS ST-02) */}
                  {installmentEnabled && availablePlans.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Select Allowed Installment Plans (ST-02)
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {availablePlans.map((plan) => {
                          const isChecked = selectedPlanIds.includes(plan.installment_plan_id);
                          return (
                            <label
                              key={plan.installment_plan_id}
                              className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <span className="text-slate-700 dark:text-slate-300">
                                {plan.plan_name} ({plan.number_of_months} Mos - {Number(plan.interest_rate) === 0 ? '0% Int' : `${plan.interest_rate}%`})
                              </span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPlanIds((prev) => [...prev, plan.installment_plan_id]);
                                  } else {
                                    setSelectedPlanIds((prev) =>
                                      prev.filter((id) => id !== plan.installment_plan_id)
                                    );
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-[#2563EB] focus:ring-blue-500 cursor-pointer"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-4 px-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-center"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <span>{initial ? 'Save Changes' : 'Create Phone'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
