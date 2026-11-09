import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Trash2,
  Clock,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { submitSellRequest } from '../../services/sellService';
import { useShopInfo } from '../../context/ShopInfoContext';
import whatsappIcon from '../../assets/icons/whatsappicon.png';

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const CONDITION_OPTIONS = [
  { value: 'Brand New', label: 'Brand New (Sealed in box, never opened)' },
  { value: 'Like New', label: 'Like New (Flawless, zero scratches or marks)' },
  { value: 'Excellent', label: 'Excellent (Light cosmetic use, no deep scratches)' },
  { value: 'Good', label: 'Good (Normal daily wear, fully functional)' },
  { value: 'Fair', label: 'Fair (Noticeable scratches, dents, or scuffs)' },
  { value: 'Poor', label: 'Poor (Cracked glass or hardware/display issues)' },
];

export default function SellPhoneModal({ desiredPhone = null, onClose }) {
  const { shopInfo, getWhatsAppUrl } = useShopInfo();
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    brand_and_model: '',
    storage_capacity: '128GB',
    phone_condition: 'Good',
    battery_health: '',
    description: '',
  });

  const [tradeInTarget, setTradeInTarget] = useState(desiredPhone);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleWhatsAppChat = () => {
    const model = submittedData?.brand_and_model || 'phone';
    const text = `Hello SK LABA PHONE! I just submitted a valuation request for my ${model}. My name is ${submittedData?.customer_name || 'Customer'}.`;
    window.open(getWhatsAppUrl(text), '_blank');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBatteryChange = (e) => {
    const newVal = e.target.value;
    const oldVal = formData.battery_health || '';

    if (!newVal || !newVal.trim()) {
      setFormData((prev) => ({ ...prev, battery_health: '' }));
      return;
    }

    if (oldVal.endsWith('%') && newVal === oldVal.slice(0, -1)) {
      const remainingDigits = newVal.slice(0, -1).replace(/\D/g, '');
      setFormData((prev) => ({
        ...prev,
        battery_health: remainingDigits ? `${remainingDigits}%` : '',
      }));
      return;
    }

    const digits = newVal.replace(/\D/g, '');
    if (!digits) {
      setFormData((prev) => ({ ...prev, battery_health: '' }));
      return;
    }

    let num = parseInt(digits, 10);
    if (num > 100) num = 100;
    if (num < 0) num = 0;

    setFormData((prev) => ({ ...prev, battery_health: `${num}%` }));
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 5) {
      setError('You can upload a maximum of 5 photos.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError(`File "${file.name}" is not a valid format (.jpg, .jpeg, .png, .webp).`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setError(null);
    setPhotos((prev) => [...prev, ...validFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
    setPhotoPreviews((prev) => {
      const urlToRevoke = prev[index];
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = formData.customer_name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your name (at least 2 characters).');
      return;
    }

    const cleanPhone = formData.phone_number.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || digitsOnly.length < 7 || digitsOnly.length > 15) {
      setError('Please provide a valid phone number (7 to 15 digits).');
      return;
    }

    const cleanBrandModel = formData.brand_and_model.trim();
    if (!cleanBrandModel || cleanBrandModel.length < 2) {
      setError('Please specify the phone brand and model you want to sell.');
      return;
    }

    let cleanBattery = formData.battery_health.trim();
    if (!cleanBattery) {
      setError('Please specify the battery health percentage (e.g. 85%).');
      return;
    }
    if (!cleanBattery.endsWith('%')) {
      cleanBattery = `${cleanBattery}%`;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('customer_name', cleanName);
      payload.append('phone_number', cleanPhone);
      payload.append('brand_and_model', cleanBrandModel);
      payload.append('storage_capacity', formData.storage_capacity);
      payload.append('phone_condition', formData.phone_condition);
      payload.append('battery_health', cleanBattery);

      if (formData.description.trim()) {
        payload.append('description', formData.description.trim());
      }

      const desiredPhoneId = tradeInTarget?.phone_id || tradeInTarget?.id;
      if (desiredPhoneId) {
        payload.append('desired_phone_id', desiredPhoneId);
      }

      photos.forEach((photo) => {
        payload.append('photos', photo);
      });

      const res = await submitSellRequest(payload);

      setSubmittedData({
        request_id: res?.data?.request_id || res?.data?.id || null,
        customer_name: cleanName,
        phone_number: cleanPhone,
        brand_and_model: cleanBrandModel,
        storage_capacity: formData.storage_capacity,
        phone_condition: formData.phone_condition,
        battery_health: cleanBattery,
        tradeInTarget,
        photoPreviews: [...photoPreviews],
        message:
          res?.message ||
          'Your sell request has been received. Our team will review the details and contact you with a valuation quote.',
      });

      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Failed to submit sell request. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md transition-opacity duration-300">
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close drawer"
      />

      <div className="absolute top-0 right-0 bottom-0 h-full w-full sm:w-[88%] md:w-[76%] lg:w-[65%] xl:w-[56%] max-w-[820px] bg-[#070b14] border-l border-white/10 shadow-[-28px_0_70px_rgba(0,0,0,0.95)] flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        
        {!success ? (
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-white/10 bg-[#090d18]/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-normal text-white tracking-tight">
                {tradeInTarget ? 'Trade-In Valuation Request' : 'Sell Your Phone'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Submit device specifications to receive a fair valuation quote from our team
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end px-6 sm:px-8 py-4 sticky top-0 z-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto px-5 py-4 sm:px-8 sm:py-6 flex-1 flex flex-col min-h-0">
          {success ? (
            <div className="py-8 max-w-lg mx-auto text-center space-y-5 my-auto">
              <div className="w-16 h-16 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
                  Valuation Request Received
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto font-normal">
                  {submittedData?.message ||
                    'Your sell request has been received. Our team will review the details and contact you with a valuation quote.'}
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-left space-y-2.5 text-xs sm:text-sm shadow-xl">
                <div className="flex justify-between py-1.5 border-b border-white/5 font-normal">
                  <span className="text-slate-400">Offered Device:</span>
                  <span className="text-white">
                    {submittedData?.brand_and_model} ({submittedData?.storage_capacity})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5 font-normal">
                  <span className="text-slate-400">Condition & Battery:</span>
                  <span className="text-white">
                    {submittedData?.phone_condition} • {submittedData?.battery_health}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5 font-normal">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="text-white">{submittedData?.customer_name}</span>
                </div>
                <div className="flex justify-between py-1.5 font-normal">
                  <span className="text-slate-400">Contact Number:</span>
                  <span className="text-white font-mono">{submittedData?.phone_number}</span>
                </div>

                {submittedData?.tradeInTarget && (
                  <div className="pt-2 mt-1 border-t border-white/5 flex justify-between py-1.5 font-normal">
                    <span className="text-slate-400">Trade-In Target Phone:</span>
                    <span className="text-white">
                      {submittedData.tradeInTarget.name || submittedData.tradeInTarget.model}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 space-y-2.5">
                <button
                  type="button"
                  onClick={handleWhatsAppChat}
                  className="w-full relative inline-flex items-center justify-center p-[0.5px] rounded-full bg-gradient-to-r from-red-600/80 via-blue-700/80 to-blue-900/80 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-black/80 group cursor-pointer"
                >
                  <span className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-normal transition-colors duration-200">
                    <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 object-contain" />
                    <span>Chat on WhatsApp regarding this valuation</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-slate-300 hover:text-white text-xs sm:text-sm font-normal transition-all cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">
              
              {tradeInTarget && (
                <div className="flex items-center justify-between gap-3 bg-white/[0.03] border border-white/15 rounded-xl px-4 py-3 shrink-0">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-normal uppercase tracking-wider text-slate-400 block">
                      Trading In Towards
                    </span>
                    <h4 className="text-xs sm:text-sm font-normal text-white truncate">
                      {tradeInTarget.name || `${tradeInTarget.brand || ''} ${tradeInTarget.model || ''}`}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTradeInTarget(null)}
                    className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors shrink-0 cursor-pointer font-normal"
                  >
                    Clear Selected Phone
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-xl text-xs sm:text-sm text-red-300 flex items-start gap-2.5 animate-in fade-in shrink-0 font-normal">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-0">
                
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm h-full">
                  
                  <div className="pb-3 border-b border-white/10 shrink-0">
                    <h3 className="text-xs font-normal uppercase tracking-wider text-white">
                      1. Device Details & Condition
                    </h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-3 space-y-3.5">
                    <div>
                      <label className="block text-xs font-normal text-slate-300 mb-1.5">
                        Phone Brand & Model <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={150}
                        placeholder="e.g. iPhone 14 Pro Max 256GB"
                        value={formData.brand_and_model}
                        onChange={(e) =>
                          setFormData({ ...formData, brand_and_model: e.target.value })
                        }
                        className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-normal focus:outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-slate-300 mb-1.5">
                        Storage Capacity <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                        {STORAGE_OPTIONS.map((cap) => {
                          const isSelected = formData.storage_capacity === cap;
                          return (
                            <button
                              key={cap}
                              type="button"
                              onClick={() => setFormData({ ...formData, storage_capacity: cap })}
                              className={`py-2 px-1 text-center text-xs sm:text-sm font-normal rounded-xl transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-white/15 text-white border border-white/40 ring-1 ring-white/30 shadow-md shadow-white/5'
                                  : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20'
                              }`}
                            >
                              {cap}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-slate-300 mb-1.5">
                        Device Condition <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.phone_condition}
                        onChange={(e) => setFormData({ ...formData, phone_condition: e.target.value })}
                        className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-normal focus:outline-none transition-all cursor-pointer shadow-inner"
                      >
                        {CONDITION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white font-normal">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                        <label className="block text-xs font-normal text-slate-300">
                          Battery Health Percentage <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                          {['100%', '90%', '85%', '80%'].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, battery_health: pct }))}
                              className={`text-[10px] px-2 py-0.5 rounded-full transition-all font-normal ${
                                formData.battery_health === pct
                                  ? 'bg-white/20 text-white border border-white/40'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-transparent'
                              }`}
                            >
                              {pct}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          placeholder="e.g. 85%"
                          value={formData.battery_health}
                          onChange={handleBatteryChange}
                          className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-normal focus:outline-none transition-all shadow-inner font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-normal text-slate-300 mb-1.5">
                        Additional Notes <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        placeholder="Any flaws, replaced parts, original box, accessories included..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full flex-1 min-h-[60px] bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-normal focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm h-full">
                  
                  <div className="pb-3 border-b border-white/10 shrink-0">
                    <h3 className="text-xs font-normal uppercase tracking-wider text-white">
                      2. Contact Information & Photos
                    </h3>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-3 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-normal text-slate-300 mb-1.5">
                          Your Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={100}
                          placeholder="Your full name"
                          value={formData.customer_name}
                          onChange={(e) =>
                            setFormData({ ...formData, customer_name: e.target.value })
                          }
                          className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-normal focus:outline-none transition-all shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-normal text-slate-300 mb-1.5">
                          Phone / WhatsApp <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="010-XXXX-XXXX"
                          value={formData.phone_number}
                          onChange={(e) =>
                            setFormData({ ...formData, phone_number: e.target.value })
                          }
                          className="w-full bg-black/40 border border-white/15 hover:border-white/30 focus:border-white/50 focus:bg-black/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-normal focus:outline-none transition-all shadow-inner font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-normal text-slate-300">
                          Device Photos <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {photos.length}/5 uploaded
                        </span>
                      </div>

                      {photos.length < 5 && (
                        <label className="flex-1 min-h-[90px] flex flex-col items-center justify-center py-4 px-4 border border-dashed border-white/20 hover:border-white/40 rounded-xl cursor-pointer bg-black/30 hover:bg-white/[0.03] transition-all group">
                          <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:scale-105 transition-all mb-1" />
                          <span className="text-xs font-normal text-white block">
                            Click to upload device photos
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-normal">
                            JPG, PNG, WebP • Max 5MB each
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                      )}

                      {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {photoPreviews.map((previewUrl, idx) => (
                            <div
                              key={idx}
                              className="relative group rounded-xl overflow-hidden border border-white/15 bg-black aspect-square shadow-sm"
                            >
                              <img
                                src={previewUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 shrink-0 space-y-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full relative inline-flex items-center justify-center p-[0.5px] rounded-full bg-gradient-to-r from-red-600/80 via-blue-700/80 to-blue-900/80 hover:from-red-500 hover:via-blue-600 hover:to-blue-800 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-black/80 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-black group-hover:bg-neutral-950 text-white text-xs sm:text-sm font-normal transition-colors duration-200">
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting Valuation Request...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Valuation Request</span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                </div>

              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
