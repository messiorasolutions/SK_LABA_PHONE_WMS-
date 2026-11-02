import React, { useState, useRef, useEffect } from 'react';
import { GitCompare, X, ArrowRight, Trash2, Plus, Smartphone, ChevronDown } from 'lucide-react';
import { useFavoritesAndCompare } from '../hooks/useFavoritesAndCompare';

export default function CompareBar({ phones = [], isOpen = false, onClose, onOpenCompare }) {
  const { compareIds, toggleCompare, removeCompare, clearCompare } = useFavoritesAndCompare();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setActiveSlotIdx(null);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // If not open and no items in comparison, hide
  if (!isOpen && compareIds.length === 0) {
    return null;
  }

  // Resolve phones from list
  const selectedPhones = compareIds.map((id) => {
    return (
      phones.find((p) => Number(p.phone_id || p.id) === Number(id)) || {
        phone_id: id,
        name: `Phone #${id}`,
      }
    );
  });

  const availablePhonesToAdd = phones.filter((p) => {
    const pId = Number(p.phone_id || p.id);
    return !compareIds.includes(pId);
  });

  const canCompare = compareIds.length >= 2 && compareIds.length <= 3;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Info badge & 3 Slots */}
        <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto py-1 max-w-full">
          <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm shrink-0 pr-1">
            <GitCompare className="w-4 h-4 text-blue-400" />
            <span>Compare ({compareIds.length}/3)</span>
          </div>

          {/* 3 Dedicated Comparison Slots */}
          <div className="flex items-center gap-2 shrink-0">
            {[0, 1, 2].map((slotIdx) => {
              const phone = selectedPhones[slotIdx];

              if (phone) {
                const id = phone.phone_id || phone.id;
                let photo = '';
                if (Array.isArray(phone.photos) && phone.photos.length > 0) photo = phone.photos[0];
                else if (phone.main_photo) photo = phone.main_photo;

                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 shrink-0 hover:border-white/30 transition-colors"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={phone.name}
                        className="w-7 h-7 object-contain rounded bg-black/40 p-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-[10px] text-white/50">
                        📱
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-white font-medium max-w-[85px] sm:max-w-[110px] truncate leading-tight">
                        {phone.name}
                      </span>
                      {phone.price && (
                        <span className="text-[10px] text-white/70 font-mono leading-none mt-0.5">
                          ${Number(phone.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCompare(id)}
                      className="text-white/40 hover:text-red-400 p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
                      title="Remove from comparison"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              // Empty Slot (Allows direct phone selection to compare)
              return (
                <div key={`slot-empty-${slotIdx}`} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlotIdx(slotIdx);
                      setDropdownOpen((prev) => (activeSlotIdx === slotIdx ? !prev : true));
                    }}
                    className="flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-white/40 rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                    title={`Slot ${slotIdx + 1}: Click to select a phone to compare`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Add Phone</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dropdown Menu to Pick Phone to Compare */}
        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute bottom-full left-4 sm:left-40 mb-2 w-72 sm:w-80 max-h-72 bg-[#0A0F1E] border border-white/20 rounded-xl shadow-2xl p-2 z-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1.5">
              <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
                Select Phone to Compare
              </span>
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="text-white/40 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {availablePhonesToAdd.length === 0 ? (
              <p className="text-xs text-white/50 py-3 text-center">
                All available phones are already added to comparison.
              </p>
            ) : (
              <div className="space-y-1">
                {availablePhonesToAdd.map((p) => {
                  const pId = p.phone_id || p.id;
                  let pPhoto = '';
                  if (Array.isArray(p.photos) && p.photos.length > 0) pPhoto = p.photos[0];
                  else if (p.main_photo) pPhoto = p.main_photo;

                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => {
                        toggleCompare(pId);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-left cursor-pointer group"
                    >
                      {pPhoto ? (
                        <img
                          src={pPhoto}
                          alt={p.name}
                          className="w-8 h-8 object-contain rounded bg-black/40 p-0.5 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs text-white/40 shrink-0">
                          📱
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate group-hover:text-blue-400">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-white/60">
                          {p.brand_name || 'Smartphone'} • ${Number(p.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-white shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right: Actions (Clear, Compare Now, Close) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="px-2.5 py-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all compared phones"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canCompare}
            onClick={() => onOpenCompare && onOpenCompare(compareIds)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${canCompare
                ? 'bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-sm hover:scale-[1.02] cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
              }`}
            title={canCompare ? 'View Side-by-Side Comparison' : 'Select at least 2 phones to compare'}
          >
            <span>Compare Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Close Dock Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Compare Bar"
              aria-label="Close Compare Bar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
