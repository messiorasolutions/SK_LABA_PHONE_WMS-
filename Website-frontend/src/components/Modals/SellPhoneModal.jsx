import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Trash2,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Camera,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getSellerTerms, submitMarketplaceListing } from '../../services/marketplaceService';
import { useShopInfo } from '../../context/ShopInfoContext';
import { formatCurrency } from '../../utils/imageHelper';

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const COMMON_BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Sony', 'Huawei', 'Other'];

const CONDITION_OPTIONS = [
  {
    grade: 'BRAND_NEW',
    title: 'Brand New',
    description: 'Factory sealed in box, never activated or used.',
    colorBadge: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
  },
  {
    grade: 'LIKE_NEW',
    title: 'Like New',
    description: 'Flawless condition, zero scratches or marks, like out of the box.',
    colorBadge: 'border-sky-500/40 text-sky-400 bg-sky-950/20',
  },
  {
    grade: 'EXCELLENT',
    title: 'Excellent',
    description: 'Minor superficial signs of use, no deep scratches or screen blemishes.',
    colorBadge: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
  },
  {
    grade: 'GOOD',
    title: 'Good',
    description: 'Normal daily cosmetic wear (small scuffs), 100% functional.',
    colorBadge: 'border-indigo-500/40 text-indigo-400 bg-indigo-950/20',
  },
  {
    grade: 'FAIR',
    title: 'Fair',
    description: 'Noticeable scratches, screen and cameras fully operational.',
    colorBadge: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
  },
];

const STEPS = [
  { id: 1, label: 'Phone', shortLabel: 'Phone' },
  { id: 2, label: 'Condition', shortLabel: 'Condition' },
  { id: 3, label: 'Photos', shortLabel: 'Photos' },
  { id: 4, label: 'Seller', shortLabel: 'Seller' },
  { id: 5, label: 'Review', shortLabel: 'Review' },
];

export default function SellPhoneModal({ desiredPhone = null, onClose }) {
  const { getWhatsAppUrl } = useShopInfo();

  // Current Step Index (1 = Phone, 2 = Condition, 3 = Photos, 4 = Seller, 5 = Review, 6 = Success)
  const [currentStep, setCurrentStep] = useState(1);

  // Terms state
  const [terms, setTerms] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form State: Phone Details (Step 1)
  const [brand, setBrand] = useState('Apple');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');

  // Form State: Condition (Step 2)
  const [conditionGrade, setConditionGrade] = useState('EXCELLENT');
  const [conditionDescription, setConditionDescription] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('85');
  const [displayCondition, setDisplayCondition] = useState('Flawless (No scratches)');
  const [physicalCondition, setPhysicalCondition] = useState('Light cosmetic wear');
  const [cameraCondition, setCameraCondition] = useState('100% Clear & Functional');
  const [biometricsStatus, setBiometricsStatus] = useState('Working (Face ID / Fingerprint)');
  const [originalBox, setOriginalBox] = useState(true);
  const [chargerIncluded, setChargerIncluded] = useState(false);

  // Form State: Photos (Step 3)
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Form State: Seller Contact (Step 4)
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');

  // Submission & Error handling
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedListing, setSubmittedListing] = useState(null);

  // Platform commission percentage (defaults to 5.00%)
  const commissionPercentage = 5.0;

  // Real-time financial calculations
  const numericPrice = useMemo(() => {
    const parsed = parseFloat(String(price).replace(/,/g, ''));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [price]);

  const commissionAmount = useMemo(() => {
    return Math.round((numericPrice * (commissionPercentage / 100)) * 100) / 100;
  }, [numericPrice, commissionPercentage]);

  const expectedPayout = useMemo(() => {
    return Math.max(0, Math.round((numericPrice - commissionAmount) * 100) / 100);
  }, [numericPrice, commissionAmount]);

  const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand;

  // Pre-fill from desiredPhone if passed
  useEffect(() => {
    if (desiredPhone) {
      if (desiredPhone.brand && COMMON_BRANDS.includes(desiredPhone.brand)) {
        setBrand(desiredPhone.brand);
      } else if (desiredPhone.brand) {
        setBrand('Other');
        setCustomBrand(desiredPhone.brand);
      }
      if (desiredPhone.name || desiredPhone.model) {
        setModel(desiredPhone.model || desiredPhone.name);
      }
    }
  }, [desiredPhone]);

  // Load active seller terms for reference
  useEffect(() => {
    getSellerTerms()
      .then((termsData) => {
        if (termsData) {
          setTerms(termsData);
        }
      })
      .catch(() => null);
  }, []);

  // Handle Photo selection
  const handlePhotoSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const remainingSlots = 10 - photos.length;
    if (remainingSlots <= 0) {
      setGeneralError('Maximum 10 photos allowed per phone listing.');
      return;
    }

    const validNewFiles = [];
    const validNewPreviews = [];

    for (const file of selectedFiles.slice(0, remainingSlots)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setGeneralError('Only JPG, PNG, and WebP image formats are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setGeneralError('Each photo must be smaller than 10MB.');
        continue;
      }

      validNewFiles.push(file);
      validNewPreviews.push(URL.createObjectURL(file));
    }

    if (validNewFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validNewFiles]);
      setPhotoPreviews((prev) => [...prev, ...validNewPreviews]);
      setGeneralError(null);
    }

    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const removed = prev[index];
      if (removed && removed.startsWith('blob:')) {
        URL.revokeObjectURL(removed);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMakeCoverPhoto = (index) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      copy.unshift(item);
      return copy;
    });
    setPhotoPreviews((prev) => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      copy.unshift(item);
      return copy;
    });
  };

  // Step Validation Functions
  const validateStep1Phone = () => {
    const errors = {};
    if (!effectiveBrand) {
      errors.brand = 'Please select or enter a brand name.';
    }
    if (!model.trim() || model.trim().length < 2) {
      errors.model = 'Please enter the exact phone model (e.g. iPhone 15 Pro Max).';
    }
    if (!storage) {
      errors.storage = 'Please select a storage option.';
    }
    if (!color.trim()) {
      errors.color = 'Please enter the phone color.';
    }
    if (!numericPrice || numericPrice <= 0) {
      errors.price = 'Please enter a valid asking price greater than zero.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2Condition = () => {
    const errors = {};
    if (!conditionDescription.trim() || conditionDescription.trim().length < 5) {
      errors.conditionDescription = 'Please describe the device condition (at least 5 characters).';
    }
    const bh = parseInt(batteryHealth, 10);
    if (batteryHealth && (isNaN(bh) || bh < 0 || bh > 100)) {
      errors.batteryHealth = 'Battery health must be a percentage between 0 and 100.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3Photos = () => {
    if (photos.length === 0) {
      setGeneralError('Please upload at least one genuine photo of your phone.');
      return false;
    }
    setGeneralError(null);
    return true;
  };

  const validateStep4Seller = () => {
    const errors = {};
    if (!sellerName.trim() || sellerName.trim().length < 2) {
      errors.sellerName = 'Please enter your full name (at least 2 characters).';
    }
    const digits = sellerPhone.replace(/\D/g, '');
    if (!sellerPhone.trim() || digits.length < 7 || digits.length > 15) {
      errors.sellerPhone = 'Please enter a valid phone number (7 to 15 digits).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sellerEmail.trim() || !emailRegex.test(sellerEmail.trim())) {
      errors.sellerEmail = 'Please provide a valid email address for listing status updates.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step Navigation: Next (Forward)
  const handleNextStep = () => {
    setGeneralError(null);
    if (currentStep === 1) {
      if (validateStep1Phone()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2Condition()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3Photos()) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (validateStep4Seller()) setCurrentStep(5);
    }
  };

  // Step Navigation: Back (Backward)
  const handlePrevStep = () => {
    setGeneralError(null);
    setFieldErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Jump to specific step (from Review Edit buttons or completed step indicators)
  const handleJumpToStep = (stepNumber) => {
    setGeneralError(null);
    setFieldErrors({});
    setCurrentStep(stepNumber);
  };

  // Submit Listing Handler
  const handleSubmitListing = async () => {
    setGeneralError(null);

    if (!termsAccepted) {
      setGeneralError('You must agree to the Seller Terms & Conditions before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('seller_name', sellerName.trim());
      payload.append('seller_phone', sellerPhone.trim());
      payload.append('seller_email', sellerEmail.trim().toLowerCase());
      payload.append('brand', effectiveBrand);
      payload.append('model', model.trim());
      payload.append('storage', storage);
      payload.append('color', color.trim());
      payload.append('condition_grade', conditionGrade);
      payload.append('condition_description', conditionDescription.trim());
      payload.append('price', String(numericPrice));
      payload.append('seller_terms_accepted', 'true');

      if (batteryHealth) {
        payload.append('battery_health', String(parseInt(batteryHealth, 10)));
      }
      if (displayCondition) {
        payload.append('display_condition', displayCondition);
      }
      if (physicalCondition) {
        payload.append('physical_condition', physicalCondition);
      }
      if (cameraCondition) {
        payload.append('camera_condition', cameraCondition);
      }
      if (biometricsStatus) {
        payload.append('biometrics_status', biometricsStatus);
      }
      payload.append('original_box', originalBox ? '1' : '0');
      payload.append('charger_included', chargerIncluded ? '1' : '0');

      photos.forEach((file) => {
        payload.append('photos', file);
      });

      const res = await submitMarketplaceListing(payload);
      setSubmittedListing(res?.data || res);
      setCurrentStep(6); // Success step
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit phone. Please check your connection and try again.';
      setGeneralError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const ref = submittedListing?.listing_ref || 'submission';
    const text = `Hi SK LABA PHONE, I just submitted my phone for Marketplace review (${ref}: ${effectiveBrand} ${model}).`;
    window.open(getWhatsAppUrl(text), '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sell-phone-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#090D1A] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 bg-[#0A1020]/90 backdrop-blur-md z-20">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 block">
              Marketplace Seller Portal
            </span>
            <h2 id="sell-phone-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
              Sell Your Smartphone
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            title="Close (Esc)"
            aria-label="Close sell phone form"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Progress Step Indicator (1 Phone • 2 Condition • 3 Photos • 4 Seller • 5 Review) */}
        {currentStep < 6 && (
          <div className="px-4 sm:px-6 py-2.5 bg-white/[0.02] border-b border-white/5 shrink-0 select-none">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              {STEPS.map((step) => {
                const isPassed = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (isPassed) handleJumpToStep(step.id);
                    }}
                    disabled={!isPassed}
                    className={`flex items-center gap-1 sm:gap-2 transition-all ${
                      isPassed ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-black shadow-sm'
                          : isCurrent
                          ? 'bg-white text-black ring-2 ring-sky-400 shadow-md'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${
                        isCurrent
                          ? 'text-white font-semibold'
                          : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-5">
          {/* General Error Banner */}
          {generalError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{generalError}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 1: PHONE DETAILS */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Brand Chips */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  Brand <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {COMMON_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        brand === b
                          ? 'bg-white text-black shadow-md ring-1 ring-white'
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {brand === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="mt-2 w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-xs focus:ring-2 focus:ring-sky-400 outline-none"
                  />
                )}
                {fieldErrors.brand && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.brand}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Exact Phone Model <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro Max, Galaxy S24 Ultra"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none placeholder:text-slate-500"
                />
                {fieldErrors.model && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.model}</p>
                )}
              </div>

              {/* Storage & Color Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Storage */}
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Storage Capacity <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B16] border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none cursor-pointer"
                  >
                    {STORAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Color <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Natural Titanium, Phantom Black"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none placeholder:text-slate-500"
                  />
                  {fieldErrors.color && (
                    <p className="text-[11px] text-red-400 mt-1">{fieldErrors.color}</p>
                  )}
                </div>
              </div>

              {/* Price with Live Payout Breakdown */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Your Asking Selling Price (Rs.) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    Rs.
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="245000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-base font-bold focus:ring-2 focus:ring-sky-400 outline-none placeholder:text-slate-600"
                  />
                </div>
                {fieldErrors.price && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.price}</p>
                )}

                {/* Live Payout Breakdown */}
                {numericPrice > 0 && (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Listing Price:</span>
                      <span className="font-semibold text-white">{formatCurrency(numericPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Platform Service Fee ({commissionPercentage}%):</span>
                      <span>- {formatCurrency(commissionAmount)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-emerald-300 font-bold text-xs sm:text-sm">
                      <span>Expected Amount You Will Receive:</span>
                      <span className="text-sm sm:text-base">{formatCurrency(expectedPayout)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 2: CONDITION & INSPECTION DETAILS */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Condition Grade Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  Device Condition Grade <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {CONDITION_OPTIONS.map((opt) => {
                    const isSelected = conditionGrade === opt.grade;
                    return (
                      <div
                        key={opt.grade}
                        onClick={() => setConditionGrade(opt.grade)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white/10 border-white ring-1 ring-white/40 shadow-md'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className={`text-xs font-bold inline-block px-2 py-0.5 rounded border ${opt.colorBadge}`}>
                            {opt.title}
                          </span>
                          <p className="text-[11px] text-slate-300">{opt.description}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white text-black border-white' : 'border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Battery Health */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Battery Health Percentage (%) (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    %
                  </span>
                </div>
                {fieldErrors.batteryHealth && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.batteryHealth}</p>
                )}
              </div>

              {/* Detailed Condition Description */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Condition Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your phone's appearance, battery life, screen condition, and any cosmetic details."
                  value={conditionDescription}
                  onChange={(e) => setConditionDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none placeholder:text-slate-500"
                />
                {fieldErrors.conditionDescription && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.conditionDescription}</p>
                )}
              </div>

              {/* Included Accessories */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-semibold text-slate-200 block">
                  Included Accessories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={originalBox}
                      onChange={(e) => setOriginalBox(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">Original Box</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chargerIncluded}
                      onChange={(e) => setChargerIncluded(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-200 font-medium">Original Charger</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 3: DEVICE PHOTOS */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Upload Device Photos <span className="text-red-400">*</span>
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Upload up to 10 authentic photos of your phone. The first photo will be used as the primary cover image.
                </p>

                {/* Upload Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                  <label className="p-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] min-h-[44px]">
                    <Camera className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold">Take Photo (Camera)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  <label className="p-3.5 rounded-xl border border-dashed border-white/30 bg-white/[0.02] hover:bg-white/5 text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] min-h-[44px]">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Choose from Gallery</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photo Previews Grid */}
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                    {photoPreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border p-1 bg-black/60 group ${
                          idx === 0 ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-white/15'
                        }`}
                      >
                        <img
                          src={previewUrl}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />

                        {/* First Photo "Cover" Badge */}
                        {idx === 0 ? (
                          <span className="absolute bottom-1 left-1 bg-sky-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                            COVER
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMakeCoverPhoto(idx)}
                            title="Set as cover photo"
                            className="absolute bottom-1 left-1 bg-black/75 hover:bg-black text-[9px] text-white px-1.5 py-0.5 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            Set Cover
                          </button>
                        )}

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          title="Remove photo"
                          aria-label={`Remove photo ${idx + 1}`}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 4: SELLER DETAILS */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Perera"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
                {fieldErrors.sellerName && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.sellerName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Mobile Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 077 123 4567"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
                {fieldErrors.sellerPhone && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.sellerPhone}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="e.g. kasun@example.com"
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-base sm:text-sm focus:ring-2 focus:ring-sky-400 outline-none"
                />
                {fieldErrors.sellerEmail && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.sellerEmail}</p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Your contact details are strictly confidential and will never be shown to buyers or published openly on the website.
                </span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 5: REVIEW & FINAL SUBMISSION */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Phone Details Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                    Phone Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(1)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Brand &amp; Model</span>
                    <span className="font-bold text-white text-sm">{effectiveBrand} {model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Storage</span>
                    <span className="font-semibold text-white">{storage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Color</span>
                    <span className="font-semibold text-white">{color || 'Standard'}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-1">
                    <span className="text-slate-400 block text-[10px] uppercase">Asking Price</span>
                    <span className="font-extrabold text-white text-base">Rs. {Number(numericPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Condition Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                    Condition &amp; Notes
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(2)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px] uppercase">Grade:</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold border border-sky-400/40 text-sky-300 bg-sky-950/40">
                      {conditionGrade.replace('_', ' ')}
                    </span>
                    {batteryHealth && (
                      <span className="text-slate-300 text-xs">
                        • Battery: <strong className="text-white">{batteryHealth}%</strong>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Description:</span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                      {conditionDescription}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 flex items-center gap-4">
                    <span>Box: <strong className="text-white">{originalBox ? 'Included' : 'No'}</strong></span>
                    <span>Charger: <strong className="text-white">{chargerIncluded ? 'Included' : 'No'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Photos Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                    Device Photos ({photoPreviews.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(3)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                {photoPreviews.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photoPreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-black/40"
                      >
                        <img
                          src={previewUrl}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 bg-sky-500 text-black text-[8px] font-extrabold px-1 rounded">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-red-400">No photos uploaded yet.</p>
                )}
              </div>

              {/* Seller Contact Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                    Seller Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(4)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Name</span>
                    <span className="font-semibold text-white">{sellerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                    <span className="font-semibold text-white">{sellerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                    <span className="font-semibold text-white">{sellerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Platform Commission & Expected Payout Card */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Commission &amp; Expected Payout
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(1)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Price</span>
                  </button>
                </div>

                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Listed Price:</span>
                  <span className="font-bold text-white">{formatCurrency(numericPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform Commission ({commissionPercentage}%):</span>
                  <span>- {formatCurrency(commissionAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-300 font-bold text-sm sm:text-base pt-2 border-t border-emerald-500/30">
                  <span>Expected Amount You Will Receive:</span>
                  <span>{formatCurrency(expectedPayout)}</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  * Note: Payout is released to you upon confirmed buyer delivery &amp; hardware verification.
                </p>
              </div>

              {/* Mandatory Seller Terms Acceptance Checkbox */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 sm:p-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setGeneralError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-sky-500 focus:ring-sky-400 border-white/20 bg-black/40 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-200 font-medium leading-relaxed">
                    I agree to the <strong className="text-white">Seller Terms &amp; Conditions</strong> (Official Version {terms?.version || '1.0'}). I certify that this device is my lawful property, is accurately represented, and I agree to direct delivery upon buyer purchase.
                  </span>
                </label>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Need to review terms details?</span>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal((prev) => !prev)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{showTermsModal ? 'Hide Terms' : 'View Full Terms'}</span>
                    {showTermsModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTermsModal && (
                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-line space-y-2 mt-2">
                    {terms?.content ? (
                      terms.content
                    ) : (
                      <>
                        <p><strong>1. Ownership:</strong> Phone must be your lawful property, not reported lost or stolen.</p>
                        <p><strong>2. Accuracy:</strong> Condition and photos must genuinely represent the actual phone.</p>
                        <p><strong>3. Commission:</strong> 5% platform commission deducted upon verified sale.</p>
                        <p><strong>4. Handover:</strong> You agree to deliver directly to the buyer when ordered.</p>
                        <p><strong>5. Payout:</strong> Released once buyer confirms delivery &amp; verification criteria are completed.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* STEP 6: SUCCESS CONFIRMATION */}
          {/* ─────────────────────────────────────────────────────────── */}
          {currentStep === 6 && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-95">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Phone Submitted for Review!
                </h3>
                {submittedListing?.listing_ref && (
                  <p className="text-xs font-mono text-sky-400 mt-1">
                    Listing Reference: <strong>{submittedListing.listing_ref}</strong>
                  </p>
                )}
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you! Our technical team will inspect your submission within 24 hours. Once verified, your phone will go live on the Marketplace and you will receive an approval email confirmation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Shop Team</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-xs shadow-lg cursor-pointer transition-all min-h-[44px]"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {currentStep < 6 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0A1020]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="py-2.5 px-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 min-h-[44px]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-6 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-2 min-h-[44px]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitListing}
                disabled={submitting || !termsAccepted}
                className="py-3 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-extrabold transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Submitting your phone...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Phone for Review</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
