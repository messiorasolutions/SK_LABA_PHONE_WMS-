import FormattedDescription from '../Common/FormattedDescription';
import React from 'react';
import { X } from 'lucide-react';

export default function DetailModal({ isOpen, onClose, title = 'Record Overview', data = null }) {
  if (!isOpen || !data) return null;

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine entity type
  const isPhone = Boolean(data.phone_id || data.phone_condition || data.stock_quantity !== undefined || data.current_stock !== undefined);
  const isBrand = Boolean(data.brand_id && !isPhone);
  const isStorage = Boolean(data.storage_id && !isPhone);
  const isSpec = Boolean(data.specification_id && !isPhone);

  // Photos parsing for phone
  let photos = [];
  if (Array.isArray(data.photos) && data.photos.length > 0) {
    photos = data.photos;
  } else if (data.main_photo) {
    photos = [data.main_photo];
  } else if (typeof data.photos === 'string' && data.photos.startsWith('[')) {
    try {
      photos = JSON.parse(data.photos);
    } catch {
      photos = [];
    }
  }

  // Colours parsing
  let colors = [];
  if (Array.isArray(data.colour_options)) {
    colors = data.colour_options;
  } else if (typeof data.colour_options === 'string') {
    try {
      colors = JSON.parse(data.colour_options);
    } catch {
      colors = data.colour_options.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }

  const renderPhoneDetails = () => (
    <div className="space-y-4">
      {/* Photo Preview if available */}
      {photos.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3 flex items-center justify-center">
          <img
            src={photos[0]}
            alt={data.name || 'Phone'}
            className="h-44 w-auto object-contain max-w-full drop-shadow-sm"
          />
        </div>
      )}

      {/* Primary Info Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          General Information
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Phone ID</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono">SKLABA_Phone_{data.phone_id}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Model Name</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.name || '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Brand</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.brand_name || data.brand_id || '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Condition</span>
            <span className="col-span-2">
              <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">
                {data.phone_condition || 'NEW'}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Price</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-semibold">{formatPrice(data.price)}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Warranty</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.warranty || 'None specified'}</span>
          </div>
        </div>
      </div>

      {/* Stock & Availability */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Stock & Availability
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Current Stock</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">
              {data.current_stock ?? data.stock_quantity ?? 0} units
            </span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Low Stock Threshold</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.low_stock_level || 5} units</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Availability Status</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">
              {data.availability ? data.availability.replace(/_/g, ' ') : 'IN STOCK'}
            </span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Catalog Status</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.status || 'PUBLISHED'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Installments</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">
              {data.installment_enabled ? 'Available / Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Colors */}
      {colors.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Colour Options ({colors.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
              >
                {typeof c === 'object' && c.color_code && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.color_code }}
                  />
                )}
                <span>{typeof c === 'object' ? (c.color_name || c.name || `Color #${i + 1}`) : c}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Description & Notes
          </div>
          <FormattedDescription content={data.description} />
        </div>
      )}

      {/* Timestamps */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
        <span>Created: {formatDate(data.created_at)}</span>
        <span>Updated: {formatDate(data.updated_at)}</span>
      </div>
    </div>
  );

  const renderBrandDetails = () => (
    <div className="space-y-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Brand Details
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Brand ID</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono">SKLABA_Brand_{data.brand_id}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Brand Name</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.brand_name || '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="col-span-2">
              <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">
                {data.is_active === 1 || data.is_active === true ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {data.description && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Description
          </div>
          <FormattedDescription content={data.description} />
        </div>
      )}

      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
        <span>Created: {formatDate(data.created_at)}</span>
        <span>Updated: {formatDate(data.updated_at)}</span>
      </div>
    </div>
  );

  const renderStorageDetails = () => (
    <div className="space-y-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Storage Option Details
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Storage ID</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono">SKLABA_Storage_{data.storage_id}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Name</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.storage_name || '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Capacity</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.capacity_gb ? `${data.capacity_gb} GB` : '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Storage Type</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.storage_type || 'Internal Storage'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="col-span-2">
              <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">
                {data.is_active === 1 || data.is_active === true ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
        <span>Created: {formatDate(data.created_at)}</span>
        <span>Updated: {formatDate(data.updated_at)}</span>
      </div>
    </div>
  );

  const renderSpecificationDetails = () => (
    <div className="space-y-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Specification Details
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Spec ID</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium font-mono">SKLABA_Spec_{data.specification_id}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Spec Name</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.specification_name || '—'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Category</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.spec_category || 'General'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Data Type</span>
            <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium">{data.data_type || 'Text'}</span>
          </div>
          <div className="grid grid-cols-3 px-3.5 py-2.5">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <span className="col-span-2">
              <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800">
                {data.is_active === 1 || data.is_active === true ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between">
        <span>Created: {formatDate(data.created_at)}</span>
        <span>Updated: {formatDate(data.updated_at)}</span>
      </div>
    </div>
  );

  const renderGenericDetails = () => (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Record Attributes
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {Object.entries(data)
          .filter(([key]) => key !== 'photos' && key !== 'main_photo')
          .map(([key, value]) => {
            let displayVal = value;
            if (value === null || value === undefined) displayVal = '—';
            else if (typeof value === 'boolean') displayVal = value ? 'Yes' : 'No';
            else if (Array.isArray(value)) displayVal = value.join(', ');
            else if (typeof value === 'object') displayVal = JSON.stringify(value);

            const label = key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div key={key} className="grid grid-cols-3 px-3.5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="col-span-2 text-slate-900 dark:text-slate-100 font-medium break-words">
                  {String(displayVal)}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Right Side Slide-Over Drawer */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Record Overview
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isPhone
            ? renderPhoneDetails()
            : isBrand
            ? renderBrandDetails()
            : isStorage
            ? renderStorageDetails()
            : isSpec
            ? renderSpecificationDetails()
            : renderGenericDetails()}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
