import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  Search,
  Phone,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  CheckCircle2,
  Calendar,
  HardDrive,
  BatteryCharging,
  Image as ImageIcon,
  ExternalLink,
  MessageCircle,
  Maximize2,
  Minimize2,
  Sparkles,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { sellRequestService } from '../services/sellRequestService';
import { userService } from '../services/userService';

const STATUS_CONFIG = {
  New: {
    label: 'New',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900',
  },
  'Quote Given': {
    label: 'Quote Given',
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900',
  },
  Accepted: {
    label: 'Accepted',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  },
  Declined: {
    label: 'Declined',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  },
  Closed: {
    label: 'Closed',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

function getConditionBadge(cond) {
  const c = String(cond || '').toLowerCase();
  if (c.includes('like new') || c.includes('flawless') || c.includes('brand new')) {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  }
  if (c.includes('good') || c.includes('minor')) {
    return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800';
  }
  if (c.includes('fair')) {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  }
  return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800';
}

function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  let date;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    let str = String(dateInput).trim();
    if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    date = new Date(str);
  }

  if (isNaN(date.getTime())) return String(dateInput);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function AuthenticatedSellPhoto({ requestId, photoPath, onZoom }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const filename = photoPath.split('/').pop().split('\\').pop();

    sellRequestService
      .getSellRequestPhotoBlob(requestId, filename)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Failed to load private photo:', filename, err);
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [requestId, photoPath]);

  if (loading) {
    return (
      <div className="w-full h-36 sm:h-44 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-pulse border border-slate-200 dark:border-slate-700">
        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="w-full h-36 sm:h-44 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-2 text-center border border-slate-200 dark:border-slate-700">
        <ImageIcon className="w-4 h-4 mb-1" />
        <span className="text-[10px]">Photo Unavailable</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => onZoom && onZoom(blobUrl)}
      className="group relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center cursor-pointer shadow-xs hover:shadow-md transition-all duration-200"
    >
      <img
        src={blobUrl}
        alt="Sell Device"
        className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity text-white">
        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-md">
          <Maximize2 className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SellPhotosLightbox({ requestId, photos, initialIndex = 0, onClose, drawerRef }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [blobs, setBlobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [drawerOffset, setDrawerOffset] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    function measureDrawer() {
      if (drawerRef && drawerRef.current) {
        const rect = drawerRef.current.getBoundingClientRect();
        const offset = window.innerWidth - rect.left;
        if (rect.left >= 380) {
          setDrawerOffset(offset);
        } else {
          setDrawerOffset(0);
        }
      } else {
        setDrawerOffset(0);
      }
    }

    measureDrawer();
    window.addEventListener('resize', measureDrawer);
    return () => window.removeEventListener('resize', measureDrawer);
  }, [drawerRef]);

  useEffect(() => {
    let active = true;
    if (!Array.isArray(photos) || photos.length === 0) return;

    setLoading(true);
    const promises = photos.map((pPath) => {
      const filename = pPath.split('/').pop().split('\\').pop();
      return sellRequestService
        .getSellRequestPhotoBlob(requestId, filename)
        .then((blob) => ({ path: pPath, url: URL.createObjectURL(blob) }))
        .catch(() => ({ path: pPath, url: null }));
    });

    Promise.all(promises).then((results) => {
      if (!active) return;
      const map = {};
      results.forEach((r) => {
        if (r.url) map[r.path] = r.url;
      });
      setBlobs(map);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [requestId, photos]);

  useEffect(() => {
    return () => {
      Object.values(blobs).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [blobs]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos, onClose]);

  const currentPath = photos[currentIndex];
  const currentBlobUrl = blobs[currentPath];
  const hasMultiple = photos.length > 1;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  };

  return createPortal(
    <div
      className={`fixed inset-y-0 left-0 bg-black/92 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-5 select-none animate-in fade-in duration-200 transition-all ${
        isFullScreen ? 'inset-0 z-[70]' : 'z-50'
      }`}
      style={{
        right: isFullScreen ? '0px' : `${drawerOffset}px`,
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white shrink-0 z-10 px-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {hasMultiple && (
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold text-white/90">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {drawerOffset > 0 && (
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all cursor-pointer"
              title={isFullScreen ? "Dock alongside sidebar" : "Expand to fullscreen"}
              aria-label={isFullScreen ? "Dock" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="relative w-full max-w-5xl flex-1 flex items-center justify-center min-h-0 my-2 px-1"
        onClick={(e) => e.stopPropagation()}
      >
        {hasMultiple && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1 sm:left-2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title="Previous (Left arrow)"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center p-2">
          {loading && !currentBlobUrl ? (
            <div className="flex flex-col items-center gap-3 text-white/70">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-xs font-medium">Loading photo...</span>
            </div>
          ) : currentBlobUrl ? (
            <img
              src={currentBlobUrl}
              alt={`Customer device photo ${currentIndex + 1}`}
              className="max-w-full max-h-[72vh] sm:max-h-[78vh] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-all duration-200"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <ImageIcon className="w-10 h-10" />
              <span className="text-xs">Photo could not be loaded</span>
            </div>
          )}
        </div>

        {hasMultiple && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1 sm:right-2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            title="Next (Right arrow)"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {hasMultiple && (
        <div
          className="flex items-center justify-center gap-2 p-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl max-w-full overflow-x-auto shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((pPath, idx) => {
            const isSel = idx === currentIndex;
            const thumbUrl = blobs[pPath];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 bg-slate-900 ${
                  isSel
                    ? 'border-blue-500 ring-2 ring-blue-500/80 scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                }`}
                title={`Jump to photo ${idx + 1}`}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body
  );
}

export default function SellRequestsPage() {
  const drawerPanelRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [staffList, setStaffList] = useState([]);

  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [editStatus, setEditStatus] = useState('New');
  const [editAssignedStaff, setEditAssignedStaff] = useState('');

  const fetchSellRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await sellRequestService.getSellRequests({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        assigned_to_user_id: assignedStaffFilter ? Number(assignedStaffFilter) : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data?.requests || []);
        setRequests(list);
        const pag = res.pagination || res.data?.pagination;
        if (pag) {
          setPagination(pag);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load sell requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellRequests();
  }, [pagination.page, statusFilter, assignedStaffFilter, fromDate, toDate]);

  useEffect(() => {
    userService
      .getUsers({ limit: 100, is_active: true })
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          setStaffList(res.data);
        }
      })
      .catch((err) => console.warn('Could not load staff list:', err));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSellRequests();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setAssignedStaffFilter('');
    setFromDate('');
    setToDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openDetailModal = async (reqItem) => {
    const reqId = reqItem.request_id || reqItem.id;
    setSelectedRequest(reqItem);
    setEditStatus(reqItem.status || 'New');
    setEditAssignedStaff(reqItem.assigned_to_user_id ? String(reqItem.assigned_to_user_id) : '');
    setModalError('');
    setModalSuccess('');
    setModalLoading(true);

    try {
      const detailRes = await sellRequestService.getSellRequestById(reqId);
      if (detailRes?.success && detailRes.data) {
        setSelectedRequest(detailRes.data);
        setEditStatus(detailRes.data.status || 'New');
        setEditAssignedStaff(
          detailRes.data.assigned_to_user_id ? String(detailRes.data.assigned_to_user_id) : ''
        );
      }
    } catch (err) {
      console.warn('Could not fetch latest details, displaying cached row:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.request_id || selectedRequest.id;
    setModalSaving(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload = {
        status: editStatus,
        assigned_to_user_id: editAssignedStaff ? Number(editAssignedStaff) : null,
      };

      const res = await sellRequestService.updateSellRequestStatus(reqId, payload);
      if (res?.success) {
        setModalSuccess('Sell request updated successfully!');
        const updatedData = res.data;

        setRequests((prev) =>
          prev.map((item) => {
            const currentId = item.request_id || item.id;
            if (currentId === reqId) {
              return {
                ...item,
                ...updatedData,
                status: updatedData.status,
                assigned_to_user_id: updatedData.assigned_to_user_id,
                assigned_staff: updatedData.assigned_staff || item.assigned_staff,
                updated_by_staff: updatedData.updated_by_staff || item.updated_by_staff,
                updated_at: updatedData.updated_at,
              };
            }
            return item;
          })
        );

        setSelectedRequest((prev) => ({
          ...prev,
          ...updatedData,
          status: updatedData.status,
          assigned_to_user_id: updatedData.assigned_to_user_id,
          assigned_staff: updatedData.assigned_staff || prev?.assigned_staff,
          updated_by_staff: updatedData.updated_by_staff || prev?.updated_by_staff,
          updated_at: updatedData.updated_at,
        }));

        setTimeout(() => {
          setSelectedRequest(null);
        }, 800);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update sell request status.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleWhatsApp = (phoneNum) => {
    const clean = String(phoneNum || '').replace(/\D/g, '');
    window.open(`https://wa.me/${clean}?text=Hello%20from%20SK%20LABA%20PHONE%20regarding%20your%20sell%20request!`, '_blank');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          Sell & Trade-In Requests
        </h1>

        <button
          onClick={fetchSellRequests}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl sm:rounded-full">
          {['', 'New', 'Quote Given', 'Accepted', 'Declined', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {st === '' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={assignedStaffFilter}
            onChange={(e) => {
              setAssignedStaffFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 rounded-full cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">All Staff Members</option>
            {staffList.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.display_name}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              title="From date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              title="To date"
            />
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, device..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Offered Device</th>
                <th className="py-3 px-4">Condition & Battery</th>
                <th className="py-3 px-4">Trade-In Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading sell requests...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No sell requests found</p>
                    <p className="text-[11px] mt-0.5 text-slate-400">
                      {search || statusFilter || assignedStaffFilter
                        ? 'Try adjusting your search criteria.'
                        : 'Customer trade-in requests will appear here.'}
                    </p>
                    {(search || statusFilter || assignedStaffFilter || fromDate || toDate) && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                requests.map((item) => {
                  const reqId = item.request_id || item.id;
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.New;
                  const staffName =
                    item.assigned_staff?.display_name ||
                    item.assigned_staff_name ||
                    item.assigned_to_user_name ||
                    (item.assigned_to_user_id ? `Staff #${item.assigned_to_user_id}` : 'Unassigned');

                  return (
                    <tr
                      key={reqId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-400">
                        {reqId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTime(item.created_at)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {item.phone_number}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          <span className="truncate max-w-[170px] block">{item.brand_and_model}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{item.storage_capacity}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.phone_condition}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                          <BatteryCharging className="w-3 h-3" />
                          <span>{item.battery_health}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.desired_phone ? (
                          <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                            <span
                              className="truncate max-w-[170px] block"
                              title={item.desired_phone.name || item.desired_phone.model || 'Target Device'}
                            >
                              {item.desired_phone.name || item.desired_phone.model || 'Target Device'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct Sale</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot || 'bg-slate-400'}`} />
                          <span>{st.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-xs ${
                            staffName === 'Unassigned'
                              ? 'text-slate-400 italic'
                              : 'text-slate-700 dark:text-slate-300 font-medium'
                          }`}
                        >
                          {staffName}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Manage &rsaquo;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs text-slate-500">
            <div>
              Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.totalPages}</span> ({pagination.totalRecords || requests.length} total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedRequest &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setSelectedRequest(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div ref={drawerPanelRef} className="w-screen max-w-lg sm:max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
                <div className="flex items-center justify-end px-3.5 sm:px-4 pt-2.5 pb-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 pb-3.5 sm:pb-4 text-xs">
                  <div className="min-h-full flex flex-col justify-between gap-2.5">
                    <div className="space-y-2">
                      {modalError && (
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{modalError}</span>
                        </div>
                      )}

                      {modalSuccess && (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{modalSuccess}</span>
                        </div>
                      )}

                      <div className="p-2.5 px-3 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Customer Information
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {selectedRequest.customer_name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{selectedRequest.phone_number}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleWhatsApp(selectedRequest.phone_number)}
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25 transition-all shadow-xs cursor-pointer"
                          title="Open WhatsApp chat"
                          aria-label="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${selectedRequest.phone_number}`}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
                          title="Call customer"
                          aria-label="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="p-2.5 px-3 bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Offered Device Specifications
                    </div>

                    <div className="grid grid-cols-4 divide-x divide-slate-200/70 dark:divide-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 rounded-lg border border-slate-200/70 dark:border-slate-800/80 p-2 sm:p-2.5">
                      <div className="pr-2 sm:pr-3 min-w-0 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                          Brand & Model
                        </span>
                        <span
                          className="font-bold text-slate-900 dark:text-white mt-0.5 block text-xs truncate"
                          title={selectedRequest.brand_and_model}
                        >
                          {selectedRequest.brand_and_model}
                        </span>
                      </div>

                      <div className="px-2 sm:px-3 min-w-0 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                          Storage
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block text-xs truncate">
                          {selectedRequest.storage_capacity}
                        </span>
                      </div>

                      <div className="px-2 sm:px-3 min-w-0 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                          Condition
                        </span>
                        <span
                          className="font-bold text-slate-900 dark:text-white mt-0.5 block text-xs truncate"
                          title={selectedRequest.phone_condition}
                        >
                          {selectedRequest.phone_condition}
                        </span>
                      </div>

                      <div className="pl-2 sm:pl-3 min-w-0 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                          Battery
                        </span>
                        <div className="mt-0.5 flex items-center gap-1">
                          <BatteryCharging className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            {selectedRequest.battery_health}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedRequest.description && (
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-0.5">
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Customer Notes</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-sans line-clamp-2">
                            {selectedRequest.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedRequest.desired_phone && (
                    <div className="p-2.5 px-3 bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Customer Wants To Trade In For
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {selectedRequest.desired_phone.name || selectedRequest.desired_phone.model}
                          </h4>
                          {selectedRequest.desired_phone.brand && (
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                              {selectedRequest.desired_phone.brand}
                            </span>
                          )}
                        </div>

                        {selectedRequest.desired_phone.price && (
                          <div className="shrink-0">
                            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800/90 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/50 shadow-xs">
                              {isNaN(Number(selectedRequest.desired_phone.price))
                                ? selectedRequest.desired_phone.price
                                : `$${Number(selectedRequest.desired_phone.price).toLocaleString()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 px-3 bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Customer Photos
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                        {Array.isArray(selectedRequest.photos) ? selectedRequest.photos.length : 0}{' '}
                        {Array.isArray(selectedRequest.photos) && selectedRequest.photos.length === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>

                    {Array.isArray(selectedRequest.photos) && selectedRequest.photos.length > 0 ? (
                      <div
                        className={`grid gap-2 pt-0.5 ${
                          selectedRequest.photos.length === 1
                            ? 'grid-cols-1 max-w-[220px] sm:max-w-[260px]'
                            : selectedRequest.photos.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {selectedRequest.photos.map((pPath, idx) => (
                          <AuthenticatedSellPhoto
                            key={idx}
                            requestId={selectedRequest.request_id || selectedRequest.id}
                            photoPath={pPath}
                            onZoom={() => setLightboxIndex(idx)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-center text-slate-400 text-xs">
                        No photos attached.
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 px-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Manage Status & Staff Assignment
                    </div>

                    <div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['New', 'Quote Given', 'Accepted', 'Declined', 'Closed'].map((st) => {
                          const isSel = editStatus === st;
                          const cfg = STATUS_CONFIG[st];
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setEditStatus(st)}
                              className={`px-1 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center flex items-center justify-center min-w-0 ${
                                isSel
                                  ? `${cfg.badge} ring-2 ring-blue-500/50 font-bold shadow-xs scale-[1.02]`
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                              title={st}
                            >
                              <span className="truncate">{st}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <select
                        value={editAssignedStaff}
                        onChange={(e) => setEditAssignedStaff(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer transition-all"
                      >
                        <option value="">-- Unassigned Staff --</option>
                        {staffList.map((u) => (
                          <option key={u.user_id} value={u.user_id}>
                            {u.display_name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleUpdateStatus}
                      disabled={modalSaving}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {modalSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {lightboxIndex !== null && selectedRequest && Array.isArray(selectedRequest.photos) && (
        <SellPhotosLightbox
          requestId={selectedRequest.request_id || selectedRequest.id}
          photos={selectedRequest.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          drawerRef={drawerPanelRef}
        />
      )}
    </div>
  );
}
