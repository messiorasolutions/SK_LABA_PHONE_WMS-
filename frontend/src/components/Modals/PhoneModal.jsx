import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Smartphone,
  Shield,
  Tag,
  Layers,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Palette,
  CreditCard,
  RefreshCw,
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
        // Standard uniform 1000x1000 square resolution for all smartphones
        const TARGET_SIZE = 1000;
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Auto-scale and center the photo to fill the square frame evenly without letterboxing
        const scale = Math.max(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const dx = (TARGET_SIZE - scaledWidth) / 2;
        const dy = (TARGET_SIZE - scaledHeight) / 2;

        ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.90));
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
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [phoneCondition, setPhoneCondition] = useState('NEW');
  const [price, setPrice] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [status, setStatus] = useState('PUBLISHED');
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Step 2: Storage & Colors
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const [localStorages, setLocalStorages] = useState(storageOptions);
  const [showAddStorageForm, setShowAddStorageForm] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newCapacityGb, setNewCapacityGb] = useState('');
  const [creatingStorage, setCreatingStorage] = useState(false);
  const [colors, setColors] = useState([]);

  // Step 3: Description, Specifications & Additional Options
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [descPreview, setDescPreview] = useState(false);
  const descRef = useRef(null);
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);

  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const merged = [...(storageOptions || [])];
    STORAGE_PRESETS.forEach((preset) => {
      const exists = merged.some(
        (s) => s.storage_name?.toLowerCase() === preset.name.toLowerCase()
      );
      if (!exists) {
        merged.push({
          storage_id: `preset_${preset.name}`,
          storage_name: preset.name,
          capacity_gb: preset.capacity_gb,
          storage_type: 'Internal UFS',
          is_active: true,
        });
      }
    });
    merged.sort((a, b) => Number(a.capacity_gb) - Number(b.capacity_gb));
    setLocalStorages(merged);
  }, [storageOptions]);

  const [loadingPlans, setLoadingPlans] = useState(false);

  // Fetch installment plans
  const fetchInstallmentPlans = () => {
    setLoadingPlans(true);
    InstallmentPlanService.getPlans()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setAvailablePlans(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Load installment plans error:', err);
      })
      .finally(() => {
        setLoadingPlans(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchInstallmentPlans();
    }
  }, [isOpen]);

  // Reset or initialize state
  useEffect(() => {
    setCurrentStep(1);
    setSubmitError('');

    if (initial) {
      setName(initial.name || '');
      setBrandId(initial.brand_id || '');
      setPhoneCondition(initial.phone_condition || 'NEW');
      setPrice(initial.price || '');
      setLowStockLevel(initial.low_stock_level ?? initial.stock_quantity ?? '');
      setAvailability(initial.availability || 'IN_STOCK');
      setStatus(initial.status || 'PUBLISHED');
      setIsNewArrival(Boolean(initial.is_new_arrival));
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
      setIsNewArrival(false);
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
      setSelectedStorageIds(storageOptions.length > 0 ? [storageOptions[0].storage_id] : []);
    }
  }, [initial, isOpen, brands, storageOptions]);

  if (!isOpen) return null;

  // Format Description Toolbar
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

  // Storage Handlers
  const handleCreateStorage = async (nameVal, capacityVal) => {
    const sName = (nameVal || newStorageName).trim();
    const sCap = Number(capacityVal || newCapacityGb);
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

  const handleToggleStorage = async (s) => {
    const sId = s.storage_id;
    if (String(sId).startsWith('preset_')) {
      try {
        const res = await StorageService.createStorageOption({
          storage_name: s.storage_name,
          capacity_gb: s.capacity_gb,
          storage_type: 'Internal UFS',
          is_active: true,
        });
        const created = res.data?.data || res.data;
        if (created?.storage_id) {
          setLocalStorages((prev) =>
            prev.map((item) => (item.storage_id === sId ? created : item))
          );
          setSelectedStorageIds((prev) => [...prev.filter((id) => id !== sId), created.storage_id]);
          return;
        }
      } catch (err) {
        console.error('Failed to create storage option:', err);
      }
    }

    setSelectedStorageIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  // Color & Photo Handlers
  const handleAddColorSlot = (preset) => {
    const newColor = {
      id: String(Date.now() + Math.random()),
      name: preset ? preset.name : '',
      color_code: preset ? preset.color_code : '#3B82F6',
      photos: [],
    };
    setColors((prev) => [...prev, newColor]);
  };

  const handleRemoveColorSlot = (id) => {
    if (colors.length <= 1) {
      setSubmitError('At least one color option is mandatory.');
      return;
    }
    setColors((prev) => prev.filter((c) => c.id !== id));
  };

  const handleColorNameChange = (id, newName) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  const handleColorCodeChange = (id, newCode) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color_code: newCode } : c))
    );
  };

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

  // Step Validation & Navigation
  const validateStep1 = () => {
    if (!name.trim()) {
      setSubmitError('Phone Model is required.');
      return false;
    }
    if (!brandId) {
      setSubmitError('Brand selection is required.');
      return false;
    }
    if (!price || Number(price) <= 0) {
      setSubmitError('A valid price greater than $0 is required.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const validateStep2 = () => {
    if (!selectedStorageIds || selectedStorageIds.length === 0) {
      setSubmitError('At least one storage option is mandatory.');
      return false;
    }
    if (!colors || colors.length === 0) {
      setSubmitError('At least one color option is mandatory.');
      return false;
    }
    for (const c of colors) {
      if (!c.name.trim()) {
        setSubmitError('Please enter a color name for all added colors.');
        return false;
      }
      if (!c.photos || c.photos.length === 0) {
        setSubmitError(
          `At least 1 photo is mandatory for color "${c.name.trim()}". (You can upload up to 3 photos).`
        );
        return false;
      }
      if (c.photos.length > 3) {
        setSubmitError(`Maximum of 3 photos allowed for color "${c.name.trim()}".`);
        return false;
      }
    }
    setSubmitError('');
    return true;
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep === 1) {
      setSubmitError('');
      setCurrentStep(1);
      return;
    }
    if (targetStep === 2) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      return;
    }
    if (targetStep === 3) {
      if (!validateStep1()) return;
      if (!validateStep2()) return;
      setCurrentStep(3);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setSubmitError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    // Format colour_options and photos
    const formattedColourOptions = colors.map((c) => ({
      name: c.name.trim(),
      color_name: c.name.trim(),
      color_code: c.color_code || '#374151',
      photos: c.photos.slice(0, 3),
    }));

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
      is_new_arrival: isNewArrival,
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
    <div className="fixed top-16 left-0 lg:left-64 right-0 bottom-0 z-30 bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Top Header / Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
              title="Back to Smartphones Inventory"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Inventory</span>
            </button>

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                {initial ? 'Edit Phone' : 'Create Phone'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {initial ? `SKLABA_Phone_${initial.phone_id}` : 'Add a new phone with color options & photos'}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Navigation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:px-6 shadow-2xs mb-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: '1. Basic Details', desc: 'Model, Brand & Price' },
              { step: 2, label: '2. Storage & Colors', desc: 'Capacities & Photos' },
              { step: 3, label: '3. Description & Specs', desc: 'Overview & Financing' },
            ].map((s, idx) => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;

              return (
                <React.Fragment key={s.step}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(s.step)}
                    className={`flex items-center gap-2 text-left cursor-pointer transition-colors group ${isActive
                        ? 'text-slate-900 dark:text-white font-semibold'
                        : isCompleted
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${isActive
                          ? 'bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white border border-rose-900/60 shadow-xs'
                          : isCompleted
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.step}
                    </span>
                    <div className="hidden sm:block">
                      <div className="text-xs font-medium leading-tight">{s.label}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                        {s.desc}
                      </div>
                    </div>
                  </button>

                  {idx < 2 && (
                    <div
                      className={`flex-1 mx-2 sm:mx-3 h-0.5 rounded transition-colors ${currentStep > idx + 1
                          ? 'bg-gradient-to-r from-neutral-900 via-rose-800 to-neutral-900 dark:from-neutral-700 dark:via-rose-700 dark:to-neutral-700'
                          : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-xl flex items-center gap-2 text-xs shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-6">

              {/* ══════════════════════════════════════════════════════════ */}
              {/* SECTION 1: BASIC INFORMATION                              */}
              {/* ══════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* 1. Phone Model */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Samsung Galaxy A54 5G"
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 transition-colors"
                    />
                  </div>

                  {/* 2. Brand & Condition */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={brandId}
                          onChange={(e) => setBrandId(e.target.value)}
                          required
                          className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Condition <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={phoneCondition}
                          onChange={(e) => setPhoneCondition(e.target.value)}
                          className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
                        >
                          <option value="NEW">New</option>
                          <option value="USED">Used</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Price & Low Stock Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                          className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={lowStockLevel}
                        onChange={(e) => setLowStockLevel(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                      />
                    </div>
                  </div>

                  {/* 4. Availability & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Availability
                      </label>
                      <div className="relative">
                        <select
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full pl-3 pr-7 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
                        >
                          <option value="PUBLISHED">Published</option>
                          <option value="DRAFT">Draft</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 5. Mark as New Arrival */}
                  <div className="pt-1">
                    <label className="relative flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-300 dark:hover:border-red-900/60 transition-all cursor-pointer group shadow-2xs">
                      <div className="flex items-center gap-3 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>Mark as New Arrival</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 uppercase tracking-wider">
                              New
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Showcase this phone with a &quot;NEW ARRIVAL&quot; badge across the store and include it in New Arrivals filters.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                        className="w-4 h-4 text-red-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-600 shrink-0"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* SECTION 2: STORAGE OPTIONS & COLORS & PHOTOS              */}
              {/* ══════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Storage Options (Mandatory) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Storage Options</span>
                          <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Select internal storage capacities for this model. (Mandatory)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                          {selectedStorageIds.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddStorageForm((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-500" />
                          <span>Add Storage</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Custom Storage Creator */}
                    {showAddStorageForm && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
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
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
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
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100"
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
                            className="px-3.5 py-1.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:opacity-50"
                          >
                            {creatingStorage ? 'Creating...' : 'Save & Select'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Storage Selection Tiles - Unified single row/grid */}
                    {localStorages.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {localStorages.map((s) => {
                          const isSelected = selectedStorageIds.includes(s.storage_id);
                          return (
                            <button
                              key={s.storage_id}
                              type="button"
                              onClick={() => handleToggleStorage(s)}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-black via-neutral-900 to-rose-950 text-white border-neutral-800 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              <span>{s.storage_name}</span>
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors ${
                                  isSelected
                                    ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50'
                                    : 'border border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                        No storage options found. Click "+ Add Storage" above to create one.
                      </div>
                    )}
                  </div>

                  {/* Colors & Photos (Mandatory) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Colors & Photos</span>
                          <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Color selection is mandatory. Upload 1 to 3 photos for each color.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddColorSlot(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-slate-500" />
                        <span>Add Color</span>
                      </button>
                    </div>

                    {/* Quick color preset chips */}
                    <div>
                      <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
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
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${alreadyAdded
                                  ? 'opacity-40 bg-slate-100 dark:bg-slate-800 border-transparent cursor-not-allowed text-slate-400'
                                  : 'bg-white dark:bg-slate-800 hover:border-rose-400/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: preset.color_code }}
                              />
                              <span>{preset.name}</span>
                              {alreadyAdded && <Check className="w-3 h-3 text-emerald-500" />}
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
                            className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2.5"
                          >
                            {/* Color Header: Swatch + Color Name + Remove */}
                            <div className="flex items-center gap-2">
                              <div className="relative shrink-0" title="Click to choose color code">
                                <input
                                  type="color"
                                  value={color.color_code || '#3B82F6'}
                                  onChange={(e) => handleColorCodeChange(color.id, e.target.value)}
                                  className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-700"
                                />
                              </div>

                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={color.name}
                                  onChange={(e) => handleColorNameChange(color.id, e.target.value)}
                                  placeholder="Color name, e.g. Natural Titanium"
                                  required
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-neutral-400 dark:focus:border-rose-900/50"
                                />
                              </div>

                              {colors.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColorSlot(color.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Remove this color"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Photo Upload Section for this Color */}
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <span>Photos ({photoCount}/3)</span>
                                  <span className="text-red-500">*</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                    (Min 1 photo, Max 3 photos)
                                  </span>
                                </span>

                                {photoCount === 0 ? (
                                  <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-900/40">
                                    At least 1 photo required (Maximum 3)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/40">
                                    ✓ {photoCount} of 3 photos added (Maximum 3)
                                  </span>
                                )}
                              </div>

                              {/* Photo Previews + Upload Slot Grid */}
                              <div className="grid grid-cols-3 gap-2">
                                {color.photos &&
                                  color.photos.map((photoUrl, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="relative aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden group/photo shadow-2xs"
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

                                {canUploadMore && (
                                  <label className="relative aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-rose-500/50 dark:hover:border-rose-400/60 bg-white/70 dark:bg-slate-900/40 hover:bg-rose-50/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-slate-500 dark:text-slate-400 hover:text-rose-600">
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
                                    <span className="text-[10px] font-medium text-center leading-tight">
                                      Upload Photo
                                    </span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                      (Min 1, Max 3)
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
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════ */}
              {/* SECTION 3: DESCRIPTION, SPECS & ADDITIONAL OPTIONS        */}
              {/* ══════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* 1. Description with Rich Formatting Toolbar */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-900 dark:text-white">
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
                          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded font-medium transition-colors cursor-pointer ${descPreview
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50'
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
                      <div className="w-full min-h-[110px] p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                        {description ? (
                          <FormattedDescription content={description} />
                        ) : (
                          <span className="text-slate-400 italic">No description entered yet.</span>
                        )}
                      </div>
                    ) : (
                      <textarea
                        ref={descRef}
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="• **Display:** 6.4-inch Super AMOLED 120Hz&#10;• **Camera:** 50MP OIS Triple Camera&#10;• **Battery:** *5000mAh* All-day battery"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50 font-mono leading-relaxed"
                      />
                    )}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Tip: Use toolbar to format with <strong>bold</strong>, <em>italic</em>, • bullet points, or numbers. Exactly same style displays on website.
                    </p>
                  </div>

                  {/* 2. Warranty (Always visible in Section 3) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <label className="text-xs font-semibold text-slate-900 dark:text-white">
                        Warranty
                      </label>
                    </div>
                    <input
                      type="text"
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      placeholder="e.g. 1 Year Manufacturer Warranty"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                    />
                  </div>

                  {/* 3. Installment Plans (Always visible in Section 3) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            Enable Installment Plans
                          </span>
                        </div>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          Allow customers to purchase with monthly financing
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={installmentEnabled}
                        onChange={(e) => setInstallmentEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>

                    {/* Select specific installment plans (SRS ST-02) */}
                    {installmentEnabled && (
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                              Choose Allowed Installment Plans
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              Select the plans customers can choose for this model ({selectedPlanIds.length} of {availablePlans.length} enabled)
                            </span>
                          </div>

                          {availablePlans.length > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedPlanIds(availablePlans.map((p) => p.installment_plan_id))}
                                className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                Select All
                              </button>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() => setSelectedPlanIds([])}
                                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Clear All
                              </button>
                            </div>
                          )}
                        </div>

                        {loadingPlans ? (
                          <div className="flex items-center gap-2 p-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            <span>Loading installment plans created by admin...</span>
                          </div>
                        ) : availablePlans.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                            {availablePlans.map((plan) => {
                              const isChecked = selectedPlanIds.includes(plan.installment_plan_id);
                              const months = Number(plan.number_of_months || 3);
                              const rate = Number(plan.interest_rate || 0);
                              const estMonthly = price && Number(price) > 0 ? ((Number(price) * (1 + rate / 100)) / months).toFixed(2) : null;

                              return (
                                <div
                                  key={plan.installment_plan_id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedPlanIds((prev) => prev.filter((id) => id !== plan.installment_plan_id));
                                    } else {
                                      setSelectedPlanIds((prev) => [...prev, plan.installment_plan_id]);
                                    }
                                  }}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                                    isChecked
                                      ? 'bg-slate-50/90 dark:bg-rose-950/20 border-slate-900 dark:border-rose-800/80 shadow-2xs'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                        {plan.plan_name}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium shrink-0">
                                        {months} Mos
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                      {rate === 0 ? '0% Interest' : `${rate}% Interest`}
                                      {estMonthly ? ` • ~$${estMonthly}/mo` : ''}
                                    </p>
                                  </div>
                                  <span
                                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] mt-0.5 transition-colors ${
                                      isChecked
                                        ? 'bg-neutral-900 dark:bg-rose-600 text-white border border-neutral-900 dark:border-rose-600'
                                        : 'border border-slate-300 dark:border-slate-600'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold block">No installment plans found</span>
                              <span className="text-[11px] text-amber-700 dark:text-amber-400">
                                Create plans in the "Installment Plans" sidebar page first.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={fetchInstallmentPlans}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer shrink-0"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Refresh</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="p-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-4">
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-center cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 py-2.5 px-6 text-xs font-medium text-white bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:from-neutral-900 hover:to-rose-900 border border-neutral-800 hover:border-rose-900/60 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>{currentStep === 1 ? 'Next: Storage & Colors' : 'Next: Specs & Options'}</span>
                  <ChevronRight className="w-4 h-4 text-rose-300" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-7 text-xs font-medium text-white bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:from-neutral-900 hover:to-rose-900 border border-neutral-800 hover:border-rose-900/60 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{initial ? 'Save Changes' : 'Create Phone'}</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
