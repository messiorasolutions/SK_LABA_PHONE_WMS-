import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  Edit2,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  KeyRound,
  UserCheck,
  Info,
  ChevronRight,
  Filter,
  Check,
  Send,
  Power,
  RotateCcw,
} from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Create Form State (PDF Section 8.5)
  const [createForm, setCreateForm] = useState({
    display_name: '',
    email: '',
    password: '',
    role: 'STAFF',
    is_active: true,
  });

  // Edit Form State (PDF Section 8.6)
  const [editForm, setEditForm] = useState({
    display_name: '',
    role: 'STAFF',
  });

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter === 'active') params.is_active = 'true';
      if (statusFilter === 'inactive') params.is_active = 'false';

      const res = await userService.getUsers(params);
      if (res?.success) {
        setUsers(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setCreateForm({
      display_name: '',
      email: '',
      password: '',
      role: 'STAFF',
      is_active: true,
    });
    setModalError('');
    setShowPassword(false);
    setCreateModalOpen(true);
  };

  // Handle Create User (PDF Section 8.5 validation)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    // Validation rules per Section 8.5
    if (!createForm.display_name.trim()) {
      setModalError('Display name is required (1–150 characters).');
      return;
    }
    if (createForm.display_name.length > 150) {
      setModalError('Display name cannot exceed 150 characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createForm.email.trim() || !emailRegex.test(createForm.email.trim())) {
      setModalError('Please provide a valid email address.');
      return;
    }
    if (!createForm.password || createForm.password.length < 8) {
      setModalError('Password must be at least 8 characters long.');
      return;
    }
    if (createForm.password.length > 128) {
      setModalError('Password cannot exceed 128 characters.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await userService.createUser({
        display_name: createForm.display_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        is_active: Boolean(createForm.is_active),
      });
      if (res?.success) {
        setCreateModalOpen(false);
        showNotification(`User account for "${res.data?.display_name || createForm.display_name}" created successfully.`);
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setModalLoading(false);
    }
  };

  // Open User Details Modal (Section 8.4 GET /api/users/:id)
  const openDetailsModal = async (userSummary) => {
    setDetailsModalUser(userSummary);
    setDetailsLoading(true);
    try {
      const res = await userService.getUserById(userSummary.user_id);
      if (res?.success && res.data) {
        setDetailsModalUser(res.data);
      }
    } catch (err) {
      // fallback to row data
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setEditModalUser(u);
    setEditForm({
      display_name: u.display_name,
      role: u.role,
    });
    setModalError('');
  };

  // Handle Edit User (PDF Section 8.6)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;

    if (!editForm.display_name.trim()) {
      setModalError('Display name is required.');
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      const res = await userService.updateUser(editModalUser.user_id, {
        display_name: editForm.display_name.trim(),
        role: editForm.role,
      });
      if (res?.success) {
        setEditModalUser(null);
        showNotification(`User "${editForm.display_name}" updated successfully.`);
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update user.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Status Toggle (Activate / Deactivate) per PDF Section 8.7
  const handleToggleStatus = async (targetUser) => {
    const nextStatus = !Boolean(targetUser.is_active);
    const actionWord = nextStatus ? 'activate' : 'deactivate';

    // Business rule: Self-deactivation is blocked for the currently logged-in administrator
    if (targetUser.user_id === currentUser?.user_id && !nextStatus) {
      alert('Administrators cannot deactivate their own account.');
      return;
    }

    if (!confirm(`Are you sure you want to ${actionWord} account for "${targetUser.display_name}"?`)) {
      return;
    }

    try {
      const res = await userService.updateUserStatus(targetUser.user_id, nextStatus);
      if (res?.success) {
        showNotification(`User account ${actionWord}d successfully.`);
        if (detailsModalUser && detailsModalUser.user_id === targetUser.user_id) {
          setDetailsModalUser({ ...detailsModalUser, is_active: nextStatus ? 1 : 0 });
        }
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || `Failed to ${actionWord} user.`);
    }
  };

  // Handle Trigger Password Reset (PDF Section 3.5 POST /api/auth/forgot-password)
  const handleSendPasswordReset = async (targetEmail, targetName) => {
    if (!confirm(`Send password reset email link to "${targetEmail}"?`)) {
      return;
    }
    try {
      const res = await authService.forgotPassword(targetEmail);
      if (res?.success) {
        showNotification(`Password reset link dispatched to ${targetEmail}.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to send password reset request.');
    }
  };

  // Metric Computations
  const totalUsers = pagination.total || users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const activeCount = users.filter((u) => Boolean(u.is_active)).length;
  const activePercentage = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 100;

  // Filtered users for table display (ensures exact match with status & role filters)
  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active' && !Boolean(u.is_active)) return false;
    if (statusFilter === 'inactive' && Boolean(u.is_active)) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Top Header & Actions (Unified Standard) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          User & Role Management
        </h1>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold rounded-full transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* ── Notification Banner ── */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Compact Stat Cards (Human-crafted layout with icons at start) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Users */}
        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-4 ring-blue-50/60 dark:ring-blue-950/40">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Total Users
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-none mt-1 block">
              {totalUsers}
            </span>
          </div>
        </div>

        {/* Administrators */}
        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 ring-4 ring-indigo-50/60 dark:ring-indigo-950/40">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Administrators
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none mt-1 block">
              {adminCount}
            </span>
          </div>
        </div>

        {/* Warehouse Staff */}
        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 ring-4 ring-cyan-50/60 dark:ring-cyan-950/40">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Warehouse Staff
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 leading-none mt-1 block">
              {staffCount}
            </span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-emerald-50/60 dark:ring-emerald-950/40">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              Active Accounts
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none mt-1 block">
              {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        {/* Role, Status & Limit Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>



          {(roleFilter || statusFilter || search) && (
            <button
              onClick={handleResetFilters}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:outline-none pl-8 pr-4 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors"
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

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Users Table Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Role Permission</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading directory from API...</span>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isActive = Boolean(u.is_active);
                  const isCurrent = u.user_id === currentUser?.user_id;
                  const lastLogin = u.last_login_at
                    ? new Date(u.last_login_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never';

                  return (
                    <tr
                      key={u.user_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400">#{u.user_id}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 ring-1 ring-white dark:ring-slate-900"
                            style={{ borderRadius: '9999px' }}
                          >
                            {u.display_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.display_name}</span>
                              {isCurrent && (
                                <span
                                  className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded-full border border-blue-200/50 dark:border-blue-900/50"
                                  style={{ borderRadius: '9999px' }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Permission (Clean transparent text, icons removed) */}
                      <td className="py-3 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Administrator
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Staff Member
                          </span>
                        )}
                      </td>

                      {/* Status (Linear-style live status indicator) */}
                      <td className="py-3 px-4">
                        {isActive ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-blink shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              Active
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Inactive
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{lastLogin}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details (Section 8.4) */}
                          <button
                            onClick={() => openDetailsModal(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-colors cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User (Section 8.6) */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            Edit
                          </button>

                          {/* Activate / Deactivate (Section 8.7) */}
                          <button
                            disabled={isCurrent && isActive}
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                              isActive
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 disabled:opacity-30 disabled:cursor-not-allowed'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40'
                            }`}
                            title={isCurrent && isActive ? 'Self-deactivation is blocked' : ''}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No accounts matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </div>

      {/* ── Slide-over Panel 1: View User Details (Opens from right side) ── */}
      {detailsModalUser && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setDetailsModalUser(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-white dark:ring-slate-800 shrink-0"
                  style={{ borderRadius: '9999px' }}
                >
                  {detailsModalUser.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <span>{detailsModalUser.display_name}</span>
                    {detailsModalUser.user_id === currentUser?.user_id && (
                      <span
                        className="text-[9px] font-mono font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/50"
                        style={{ borderRadius: '9999px' }}
                      >
                        You
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{detailsModalUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {detailsLoading && (
                <div className="flex items-center gap-2 text-blue-600 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading fresh API record...</span>
                </div>
              )}

              {/* Status and Role badges */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    System Role
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {detailsModalUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Account Status
                  </span>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {Boolean(detailsModalUser.is_active) ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-blink shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <span>{Boolean(detailsModalUser.is_active) ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {/* Audit Timestamps */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Audit & Session Details
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">User ID:</span>
                    <span className="font-mono font-semibold">#{detailsModalUser.user_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Login:</span>
                    <span className="font-medium">
                      {detailsModalUser.last_login_at
                        ? new Date(detailsModalUser.last_login_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Account Created:</span>
                    <span className="font-medium">
                      {detailsModalUser.created_at
                        ? new Date(detailsModalUser.created_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Updated:</span>
                    <span className="font-medium">
                      {detailsModalUser.updated_at
                        ? new Date(detailsModalUser.updated_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions & Security Note */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Role Permissions: {detailsModalUser.role}</span>
                </div>
                <p>
                  {detailsModalUser.role === 'ADMIN'
                    ? 'This user has full access to Phone inventory, customer inquiries, and user management.'
                    : 'This user can manage phone stock and view customer inquiries, but is blocked from user management.'}
                </p>
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSendPasswordReset(detailsModalUser.email, detailsModalUser.display_name)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Send Reset Email</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = detailsModalUser;
                    setDetailsModalUser(null);
                    openEditModal(u);
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-full hover:bg-slate-50 cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsModalUser(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Slide-over Panel 2: Create User Account (Opens from right side) ── */}
      {createModalOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setCreateModalOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-4 ring-blue-50/60 dark:ring-blue-950/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Create User Account
                </h2>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body with Generous Spacing & Clean Alignment */}
            <form id="create-user-form" onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{modalError}</span>
                </div>
              )}

              {/* Field 1: Display Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nimal Silva"
                  value={createForm.display_name}
                  onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Field 2: Email Address */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nimal@sklabaphone.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Field 3: Temporary Password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters (Argon2id)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 pr-11 text-xs text-slate-900 dark:text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 leading-relaxed">
                  Password will be hashed using Argon2id. Must be 8–128 characters long.
                </p>
              </div>

              {/* Field 4 & 5: Role & Initial Status (Balanced 2-Column Grid) */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                    Role
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                    Initial Status
                  </label>
                  <select
                    value={createForm.is_active ? 'true' : 'false'}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, is_active: e.target.value === 'true' })
                    }
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Pinned Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={modalLoading}
                className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold rounded-full disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/25 transition-all"
              >
                {modalLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Slide-over Panel 3: Edit User Profile (Opens from right side) ── */}
      {editModalUser && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setEditModalUser(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 ring-4 ring-blue-50/60 dark:ring-blue-950/40">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Edit User Profile
                </h2>
              </div>
              <button
                onClick={() => setEditModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body with Generous Spacing & Clean Alignment */}
            <form id="edit-user-form" onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{modalError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={editModalUser.email}
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500 font-mono rounded-xl cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 leading-relaxed">
                  Password changes are not supported directly here; use the password-reset workflow.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer shadow-2xs"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 leading-relaxed">
                  Note: The final active administrator must not be demoted to STAFF.
                </p>
              </div>
            </form>

            {/* Pinned Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-user-form"
                disabled={modalLoading}
                className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold rounded-full disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/25 transition-all"
              >
                {modalLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  );
}
