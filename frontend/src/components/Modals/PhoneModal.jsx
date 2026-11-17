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
  BatteryCharging,
} from 'lucide-react';
import FormattedDescription from '../Common/FormattedDescription';
import InstallmentPlanService from '../../services/installmentPlanService';
import StorageService from '../../services/storageService';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

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
  const { rate: krwToLkrRate, rateInfo, loading: rateLoading, refreshRate, convertKrwToLkr, formatLkr } = useCurrencyConverter();

  // Step 1: Basic Information
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [phoneCondition, setPhoneCondition] = useState('NEW');
  const [price, setPrice] = useState('');
  const [lowStockLevel, setLowStockLevel] = useState('');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [status, setStatus] = useState('PUBLISHED');
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Step 2: Phone Photos (Min 6, Max 12)
  const [photos, setPhotos] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);

  // Step 3: Description, Specifications & Additional Options
  const [warranty, setWarranty] = useState('');
  const [description, setDescription] = useState('');
  const [descPreview, setDescPreview] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState('');
  const [isGenuineBattery, setIsGenuineBattery] = useState(true);
  const [isOriginalHousing, setIsOriginalHousing] = useState(true);
  const [displaySize, setDisplaySize] = useState('');
  const descRef = useRef(null);
  const step3EnteredAtRef = useRef(0);
  const [installmentEnabled, setInstallmentEnabled] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);

  const [submitError, setSubmitError] = useState('');

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
      setBatteryHealth(initial.battery_health !== undefined && initial.battery_health !== null ? String(initial.battery_health) : '');
      setIsGenuineBattery(initial.is_genuine_battery !== undefined && initial.is_genuine_battery !== null ? Boolean(initial.is_genuine_battery) : true);
      setIsOriginalHousing(initial.is_original_housing !== undefined && initial.is_original_housing !== null ? Boolean(initial.is_original_housing) : true);
      setDisplaySize(initial.display_size || '');

      // Parse phone photos (Min 6, Max 12)
      let initialPhotos = [];
      if (Array.isArray(initial.photos)) {
        initialPhotos = initial.photos;
      } else if (typeof initial.photos === 'string' && initial.photos.trim().startsWith('[')) {
        try {
          initialPhotos = JSON.parse(initial.photos);
        } catch {
          initialPhotos = [];
        }
      }

      // If initial.photos is empty, fallback to photos stored in colour_options
      if (initialPhotos.length === 0 && initial.colour_options) {
        let rawColors = initial.colour_options;
        if (typeof rawColors === 'string' && rawColors.trim().startsWith('[')) {
          try {
            rawColors = JSON.parse(rawColors);
          } catch {}
        }
        if (Array.isArray(rawColors)) {
          initialPhotos = rawColors.flatMap((c) => c.photos || []).filter(Boolean);
        }
      }
      setPhotos(Array.isArray(initialPhotos) ? initialPhotos.slice(0, 12) : []);

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
      setBatteryHealth('');
      setIsGenuineBattery(true);
      setIsOriginalHousing(true);
      setDisplaySize('');
      setPhotos([]);
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

  // Phone Photo Handlers (Min 6, Max 12)
  const handleUploadPhotos = async (files) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 12 - photos.length;
    if (remainingSlots <= 0) {
      alert('Maximum of 12 photos allowed for this phone.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const compressedList = [];
    for (const file of filesToUpload) {
      const dataUrl = await compressImage(file);
      if (dataUrl) compressedList.push(dataUrl);
    }

    setPhotos((prev) => [...prev, ...compressedList].slice(0, 12));
    setSubmitError('');
  };

  const handleRemovePhoto = (photoIdx) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== photoIdx));
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
      setSubmitError('A valid price greater than ₩0 is required.');
      return false;
    }
    setSubmitError('');
    return true;
  };

  const validateStep2 = () => {
    if (!photos || photos.length < 6) {
      setSubmitError(
        `At least 6 photos are required (currently uploaded: ${photos?.length || 0}/12 — need ${6 - (photos?.length || 0)} more).`
      );
      return false;
    }
    if (photos.length > 12) {
      setSubmitError('Maximum of 12 photos allowed.');
      return false;
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
      step3EnteredAtRef.current = Date.now();
      setCurrentStep(3);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        step3EnteredAtRef.current = Date.now();
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    setSubmitError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // STRICT GUARD: A phone can ONLY be saved when explicitly confirmed on Step 3
    if (currentStep !== 3) {
      return;
    }
    // Lock out accidental click-throughs from Step 2's Next button
    if (Date.now() - step3EnteredAtRef.current < 600) {
      return;
    }
    if (loading) {
      return;
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    const isPhoneInStock = availability === 'IN_STOCK' || Number(lowStockLevel) > 0;
    const finalAvailability = isPhoneInStock ? 'IN_STOCK' : (availability === 'COMING_SOON' ? 'COMING_SOON' : 'SOLD_OUT');

    const payload = {
      name: name.trim(),
      brand_id: Number(brandId),
      phone_condition: phoneCondition,
      price: Number(price),
      low_stock_level: 5,
      current_stock: isPhoneInStock ? 10 : 0,
      stock_quantity: isPhoneInStock ? 10 : 0,
      in_stock: isPhoneInStock,
      availability: finalAvailability,
      status,
      is_new_arrival: isNewArrival,
      warranty: warranty.trim(),
      description: description.trim(),
      battery_health: batteryHealth.trim() || null,
      is_genuine_battery: isGenuineBattery,
      is_original_housing: isOriginalHousing,
      display_size: displaySize.trim() || null,
      installment_enabled: installmentEnabled,
      installment_plan_ids: installmentEnabled ? selectedPlanIds : [],
      storage_ids: selectedStorageIds && selectedStorageIds.length > 0 ? selectedStorageIds : (storageOptions.length > 0 ? [storageOptions[0].storage_id] : []),
      colour_options: [{ name: 'Standard', color_name: 'Standard', color_code: '#1E293B', photos }],
      photos: photos,
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
                {initial ? `SKLABA_Phone_${initial.phone_id}` : 'Add a new phone with 6 to 12 photos'}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Navigation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:px-6 shadow-2xs mb-6">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: '1. Basic Details', desc: 'Model, Brand & Price' },
              { step: 2, label: '2. Phone Photos', desc: 'Upload 6 to 12 Photos' },
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Prevent any implicit form submissions — saving requires deliberate button click
            }}
            onKeyDown={(e) => {
              // Prevent accidental form submission when pressing Enter in single-line text inputs
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
          >
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
                        Price (₩ KRW) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">₩</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="50000"
                          required
                          className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                        />
                      </div>
                      {price && Number(price) > 0 ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>≈ {formatLkr(convertKrwToLkr(price))}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            (API: 1 KRW ≈ {Number(krwToLkrRate).toFixed(4)} LKR)
                          </span>
                          <button
                            type="button"
                            onClick={refreshRate}
                            disabled={rateLoading}
                            title="Fetch latest live exchange rate from API"
                            className="inline-flex items-center gap-0.5 text-[10px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer ml-1"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${rateLoading ? 'animate-spin' : ''}`} />
                            {rateLoading ? 'Updating...' : 'Live API'}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Enter amount in South Korean Won (₩)</span>
                          <span className="text-slate-500">
                            Daily API Rate: 1 KRW ≈ {Number(krwToLkrRate).toFixed(4)} LKR
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Stock Status
                      </label>
                      <label className="flex items-center gap-2.5 h-[38px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <input
                          type="checkbox"
                          checked={availability === 'IN_STOCK' || Number(lowStockLevel) > 0}
                          onChange={(e) => {
                            const inStock = e.target.checked;
                            setAvailability(inStock ? 'IN_STOCK' : 'SOLD_OUT');
                            setLowStockLevel(inStock ? '10' : '0');
                          }}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {availability === 'IN_STOCK' || Number(lowStockLevel) > 0 ? 'In Stock (Available)' : 'Out of Stock (Sold Out)'}
                        </span>
                      </label>
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
              {/* SECTION 2: PHONE PHOTOS (MIN 6, MAX 12)                  */}
              {/* ══════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Phone Photos</span>
                          <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Upload 6 to 12 photos for this phone. (Minimum 6 photos, Maximum 12 photos)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {photos.length < 6 ? (
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200/60 dark:border-amber-900/60">
                            Min 6 photos required ({photos.length}/12 added — need {6 - photos.length} more)
                          </span>
                        ) : photos.length >= 12 ? (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/60">
                            ✓ 12 of 12 photos added (Maximum reached)
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-900/60">
                            ✓ {photos.length} of 12 photos added (Ready)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Photo Previews + Upload Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                      {photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative aspect-square rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1 flex items-center justify-center overflow-hidden group/photo shadow-2xs"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1}`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(pIdx)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100 hover:scale-110"
                            title="Delete photo"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-black/75 text-white backdrop-blur-xs">
                            {pIdx === 0 ? '#1 Main' : `#${pIdx + 1}`}
                          </span>
                        </div>
                      ))}

                      {photos.length < 12 && (
                        <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500/60 dark:hover:border-rose-400/60 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-rose-50/20 flex flex-col items-center justify-center gap-1.5 p-3 text-center cursor-pointer transition-all text-slate-500 dark:text-slate-400 hover:text-rose-600 shadow-2xs group">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            onChange={(e) => {
                              handleUploadPhotos(e.target.files);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/50 flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rose-600">
                            Add Photos
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({12 - photos.length} slots left)
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span>• First photo (#1) will be used as the primary storefront image.</span>
                      <span>Requires minimum 6 photos • Maximum 12 photos</span>
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

                  {/* 2. Device Specifications & Hardware Condition (Battery, Housing, Display) */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <label className="text-xs font-semibold text-slate-900 dark:text-white">
                        Battery, Housing &amp; Display Specifications
                      </label>
                    </div>

                    {/* Battery Health Input + Genuine Battery Checkbox */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Battery Health
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={batteryHealth}
                            onChange={(e) => setBatteryHealth(e.target.value)}
                            placeholder="e.g. 85% or 100%"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0">
                          <input
                            type="checkbox"
                            checked={isGenuineBattery}
                            onChange={(e) => setIsGenuineBattery(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            Genuine Battery
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({isGenuineBattery ? 'Genuine' : 'Battery Replaced'})
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Original Phone Housing Checkbox */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer select-none">
                        <div>
                          <span className="block text-xs font-medium text-slate-800 dark:text-slate-200">
                            Original Phone Housing
                          </span>
                          <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                            Status: <strong className={isOriginalHousing ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{isOriginalHousing ? 'Original Phone Housing' : 'Housing Replaced'}</strong>
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isOriginalHousing}
                          onChange={(e) => setIsOriginalHousing(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Display Size Input */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Display Size
                      </label>
                      <input
                        type="text"
                        value={displaySize}
                        onChange={(e) => setDisplaySize(e.target.value)}
                        placeholder='e.g. 6.4" or 6.7 inches'
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-neutral-400 dark:focus:border-rose-900/50"
                      />
                    </div>
                  </div>

                  {/* 3. Warranty (Always visible in Section 3) */}
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
                              const estMonthly = price && Number(price) > 0 ? Math.round((Number(price) * (1 + rate / 100)) / months) : null;

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
                                      {estMonthly ? ` • ~₩${estMonthly.toLocaleString()}/mo` : ''}
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
                  key={`step-next-btn-${currentStep}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="inline-flex items-center gap-1.5 py-2.5 px-6 text-xs font-medium text-white bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:from-neutral-900 hover:to-rose-900 border border-neutral-800 hover:border-rose-900/60 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <span>{currentStep === 1 ? 'Next: Phone Photos' : 'Next: Specs & Options'}</span>
                  <ChevronRight className="w-4 h-4 text-rose-300" />
                </button>
              ) : (
                <button
                  key="step-save-btn"
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(e);
                  }}
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
