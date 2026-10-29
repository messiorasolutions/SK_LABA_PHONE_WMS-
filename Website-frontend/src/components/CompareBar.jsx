import React from 'react';
import { GitCompare, X, ArrowRight, Trash2 } from 'lucide-react';
import { useFavoritesAndCompare } from '../hooks/useFavoritesAndCompare';

export default function CompareBar({ phones = [], onOpenCompare }) {
  const { compareIds, removeCompare, clearCompare } = useFavoritesAndCompare();

  if (compareIds.length === 0) return null;

  // Resolve phones from list
  const selectedPhones = compareIds.map((id) => {
    return phones.find((p) => Number(p.phone_id || p.id) === Number(id)) || {
      phone_id: id,
      name: `Phone #${id}`,
    };
  });

  const canCompare = compareIds.length >= 2 && compareIds.length <= 3;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-3xl">
      <div className="bg-theme-surface/95 backdrop-blur-xl border border-theme-accent/40 rounded-2xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Info & items */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
          <div className="flex items-center gap-2 text-theme-accentLight font-semibold text-xs sm:text-sm shrink-0">
            <GitCompare className="w-4 h-4 text-theme-accent" />
            <span>Compare ({compareIds.length}/3)</span>
          </div>

          {/* Mini Phone items */}
          <div className="flex items-center gap-2">
            {selectedPhones.map((p) => {
              const id = p.phone_id || p.id;
              let photo = '';
              if (Array.isArray(p.photos) && p.photos.length > 0) photo = p.photos[0];
              else if (p.main_photo) photo = p.main_photo;

              return (
                <div
                  key={id}
                  className="relative group flex items-center gap-2 bg-theme-input/90 border border-theme-border rounded-xl px-2.5 py-1.5 shrink-0"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={p.name}
                      className="w-7 h-7 object-contain rounded"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-theme-surface rounded flex items-center justify-center text-[10px] text-theme-textMuted font-bold">
                      📱
                    </div>
                  )}
                  <span className="text-xs text-theme-textPrimary font-medium max-w-[90px] sm:max-w-[120px] truncate">
                    {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCompare(id)}
                    className="text-theme-textMuted hover:text-red-400 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={clearCompare}
            className="px-3 py-1.5 rounded-xl text-theme-textMuted hover:text-red-400 hover:bg-white/5 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            type="button"
            disabled={!canCompare}
            onClick={() => onOpenCompare && onOpenCompare(compareIds)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              canCompare
                ? 'bg-theme-accent hover:bg-theme-accentHover text-white shadow-lg shadow-blue-600/30 hover:scale-[1.02] cursor-pointer'
                : 'bg-theme-input text-theme-textMuted cursor-not-allowed border border-theme-border'
            }`}
          >
            <span>Compare Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

