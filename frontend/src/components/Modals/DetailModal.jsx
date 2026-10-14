import React from 'react';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import Button from '../ui/Button';
import { X, Eye, Info } from 'lucide-react';

export default function DetailModal({ isOpen, onClose, title = 'Details', data = null }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        className="rounded-2xl shadow-xl border max-w-lg w-full overflow-hidden"
      >
        <div
          style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}
          className="flex items-center justify-between px-5 py-3.5 border-b"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
            >
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className={TYPOGRAPHY.heading}>{title}</h3>
              <p className={TYPOGRAPHY.caption}>Raw API Record details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-800">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
