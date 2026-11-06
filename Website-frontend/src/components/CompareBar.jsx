import React, { useState, useRef, useEffect } from 'react';
import { GitCompare, X, ArrowRight, Trash2, Plus, Search } from 'lucide-react';
import { useFavoritesAndCompare } from '../hooks/useFavoritesAndCompare';

export default function CompareBar({ phones = [], isOpen = false, onClose, onOpenCompare }) {
  const { compareIds, toggleCompare, removeCompare, clearCompare } = useFavoritesAndCompare();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click & reset search query
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setActiveSlotIdx(null);
        setSearchQuery('');
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Reset search whenever dropdown closes
  useEffect(() => {
    if (!dropdownOpen) {
      setSearchQuery('');
    }
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

  const filteredPhonesToAdd = availablePhonesToAdd.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const brandMatch = (p.brand_name || p.brand || '').toLowerCase().includes(q);
    return nameMatch || brandMatch;
  });

  const canCompare = compareIds.length >= 2 && compareIds.length <= 3;

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-11/12 max-w-4xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Info badge & 3 Slots */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 max-w-full [scrollbar-width:none]">
          <div className="flex items-center gap-1.5 text-white font-semibold text-xs shrink-0 pr-1">
            <GitCompare className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Compare</span>
            <span>({compareIds.length}/3)</span>
          </div>

          {/* 3 Dedicated Comparison Slots */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                    className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/15 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 shrink-0 hover:border-white/30 transition-colors"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={phone.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded bg-black/40 p-0.5"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/5 rounded flex items-center justify-center text-[10px] text-white/50">
                        📱
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] sm:text-xs text-white font-medium max-w-[70px] sm:max-w-[100px] truncate leading-tight">
                        {phone.name}
                      </span>
                      {phone.price && (
                        <span className="text-[9px] sm:text-[10px] text-white/70 font-mono leading-none mt-0.5">
                          ${Number(phone.price).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCompare(id)}
                      className="text-white/40 hover:text-red-400 p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
                      title="Remove from comparison"
                    >
                      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                );
              }

              // Empty Slot
              return (
                <div key={`slot-empty-${slotIdx}`} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlotIdx(slotIdx);
                      setDropdownOpen((prev) => (activeSlotIdx === slotIdx ? !prev : true));
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-white/40 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs text-white/60 hover:text-white transition-all cursor-pointer shrink-0"
                    title={`Slot ${slotIdx + 1}: Click to select a phone to compare`}
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-[10px] sm:text-[11px] font-medium">Add Phone</span>
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
            className="absolute bottom-full left-0 sm:left-4 md:left-36 mb-2.5 w-full sm:w-88 md:w-96 bg-[#0A0F1E]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-white/10">
              <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                <span>Select Phone to Compare</span>
                {availablePhonesToAdd.length > 0 && (
                  <span className="text-[10px] text-white/40 font-normal">
                    ({filteredPhonesToAdd.length})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input Filter Bar */}
            {availablePhonesToAdd.length > 0 && (
              <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by model or brand..."
                    autoFocus
                    className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 border border-white/15 focus:border-blue-500/70 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-white/40 outline-none transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Phone List - Shows exactly 4 items (~208px) with clean scrolling for more */}
            {availablePhonesToAdd.length === 0 ? (
              <div className="py-6 px-3 text-center">
                <p className="text-xs text-white/50">
                  All available smartphones are already added to comparison.
                </p>
              </div>
            ) : filteredPhonesToAdd.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-1">
                <p className="text-xs text-white/70 font-medium">No smartphones found</p>
                <p className="text-[11px] text-white/40">
                  No matching models found for "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="p-1.5 max-h-[208px] overflow-y-auto space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                {filteredPhonesToAdd.map((p) => {
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
                      className="w-full flex items-center gap-2.5 p-1.5 sm:p-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all text-left cursor-pointer group border border-transparent hover:border-white/10"
                    >
                      {pPhoto ? (
                        <img
                          src={pPhoto}
                          alt={p.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg bg-black/40 p-1 shrink-0 border border-white/10 group-hover:border-blue-400/40 transition-colors"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/40 shrink-0 border border-white/10">
                          📱
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-white/60 flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{p.brand_name || 'Smartphone'}</span>
                          <span>•</span>
                          <span className="font-mono text-white/80">${Number(p.price || 0).toFixed(0)}</span>
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-white/40 group-hover:text-blue-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right: Actions (Clear, Compare Now, Close) */}
        <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 border-white/10 pt-1.5 md:pt-0">
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear all compared phones"
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canCompare}
            onClick={() => onOpenCompare && onOpenCompare(compareIds)}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all ${
              canCompare
                ? 'bg-white/10 hover:bg-white/15 border border-white/20 text-white shadow-sm hover:scale-[1.02] cursor-pointer'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
            }`}
            title={canCompare ? 'View Side-by-Side Comparison' : 'Select at least 2 phones to compare'}
          >
            <span>Compare Now</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Close Dock Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Close Compare Bar"
              aria-label="Close Compare Bar"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
