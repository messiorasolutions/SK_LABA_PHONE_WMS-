import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  MessageSquare,
  CalendarClock,
  Shield,
  Smartphone,
  Package,
  CreditCard,
  Tag,
  LogOut,
  ArrowLeftRight,
  Star,
  BellRing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
      navigate('/login');
    }
  };

  const isUsersActive = location.pathname.startsWith('/users');
  const isPhoneManagementActive =
    location.pathname.startsWith('/phone-management') || location.pathname.startsWith('/phones');
  const isStockActive =
    location.pathname.startsWith('/stock-management') ||
    location.pathname.startsWith('/stock') ||
    location.pathname.startsWith('/storage-management');
  const isOffersActive =
    location.pathname.startsWith('/offers') ||
    location.pathname.startsWith('/offer-management');
  const isInstallmentsActive =
    location.pathname.startsWith('/installment-plans') ||
    location.pathname.startsWith('/installments');
  const isReservationsActive = location.pathname.startsWith('/reservations');
  const isInquiriesActive = location.pathname.startsWith('/inquiries');
  const isSellRequestsActive = location.pathname.startsWith('/sell-requests');
  const isBackInStockActive = location.pathname.startsWith('/back-in-stock') || location.pathname.startsWith('/dashboard/back-in-stock');
  const isReviewsActive = location.pathname.startsWith('/reviews');

  const displayName = user?.display_name || user?.name || 'Admin';
  const userInitial = displayName.charAt(0).toUpperCase();
  const userRole = user?.role
    ? user.role.toLowerCase() === 'admin'
      ? 'ADMINISTRATOR'
      : user.role.toUpperCase()
    : 'ADMINISTRATOR';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-slate-950 p-1.5 flex items-center justify-center border border-slate-800 shadow-sm shrink-0 overflow-hidden">
            <img
              src={logoImg}
              alt="SK Laaba Phone"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="overflow-hidden leading-tight flex-1 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-black text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent tracking-tight">
                SK
              </span>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Laaba Phone
              </span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mt-0.5">
              South Korea
            </span>
          </div>
        </div>

        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <nav className="space-y-1.5 text-xs">
            {isAdmin && (
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                    isUsersActive
                      ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {isUsersActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
                )}
                <Shield
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isUsersActive
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">User & Role Management</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/reviews"
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                    isReviewsActive
                      ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {isReviewsActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
                )}
                <Star
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isReviewsActive
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">Customer Reviews</span>
              </NavLink>
            )}

            {/* 2. Phone Management (ST-01, ST-02, ST-03, MG-01) */}
            <NavLink
              to="/phone-management"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isPhoneManagementActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isPhoneManagementActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <Smartphone
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isPhoneManagementActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Phone Management</span>
            </NavLink>

            {/* 3. Stock Management (SRS ST-05) */}
            <NavLink
              to="/stock-management"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isStockActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isStockActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <Package
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isStockActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Stock Management</span>
            </NavLink>

            {/* 4. Offers Management (SRS MG-03) */}
            <NavLink
              to="/offers"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isOffersActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isOffersActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <Tag
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isOffersActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Offers Management</span>
            </NavLink>

            {/* 5. Installment Plans Management (SRS MG-11) */}
            <NavLink
              to="/installment-plans"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isInstallmentsActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isInstallmentsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <CreditCard
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isInstallmentsActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Installment Plans</span>
            </NavLink>

            {/* 6. Customer Reservations (SRS ST-07) */}
            <NavLink
              to="/reservations"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isReservationsActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isReservationsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <CalendarClock
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isReservationsActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Customer Reservations</span>
            </NavLink>

            {/* 7. Customer Inquiries (SRS ST-06) */}
            <NavLink
              to="/inquiries"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isInquiriesActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isInquiriesActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <MessageSquare
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isInquiriesActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Customer Inquiries</span>
            </NavLink>

            <NavLink
              to="/sell-requests"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isSellRequestsActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isSellRequestsActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <ArrowLeftRight
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isSellRequestsActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Sell / Trade-In Requests</span>
            </NavLink>

            {/* 9. Back-in-Stock Requests (SRS ST-08) */}
            <NavLink
              to="/back-in-stock"
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-xl font-semibold transition-all duration-150 ${
                  isBackInStockActive
                    ? 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`
              }
            >
              {isBackInStockActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-rose-600 to-neutral-900 rounded-r-full" />
              )}
              <BellRing
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isBackInStockActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">Back-in-Stock Alerts</span>
            </NavLink>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-800 border border-rose-900/50"
                style={{ borderRadius: '9999px' }}
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {displayName}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-blink shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.6)]" />
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
