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
  RotateCcw,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const formatUserId = (id) => {
  if (!id && id !== 0) return '';
  if (typeof id === 'string' && id.startsWith('SK_USER_')) return id;
  const num = parseInt(id, 10);
  if (isNaN(num)) return `SK_USER_${id}`;
  return `SK_USER_${String(num).padStart(2, '0')}`;
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [deactivateModalUser, setDeactivateModalUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [createForm, setCreateForm] = useState({
    display_name: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  const [editForm, setEditForm] = useState({
    display_name: '',
    email: '',
    role: 'STAFF',
    password: '',
  });

  const showNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 5500);
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
      if (statusFilter) {
        params.status = statusFilter.toUpperCase();
      }

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

  const openCreateModal = () => {
    setCreateForm({
      display_name: '',
      email: '',
      password: '',
      role: 'STAFF',
    });
    setModalError('');
    setShowPassword(false);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

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
      setModalError('Temporary password must be at least 8 characters long.');
      return;
    }
    if (createForm.password.length > 128) {
      setModalError('Temporary password cannot exceed 128 characters.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await userService.createUser({
        display_name: createForm.display_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      if (res?.success) {
        setCreateModalOpen(false);
        showNotification(
          `User account created for "${createForm.display_name}". A verification email with temporary credentials has been sent.`
        );
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create user account.');
    } finally {
      setModalLoading(false);
    }
  };

  const openDetailsModal = async (userSummary) => {
    setDetailsModalUser(userSummary);
    setDetailsLoading(true);
    try {
      const res = await userService.getUserById(userSummary.user_id);
      if (res?.success && res.data) {
        setDetailsModalUser(res.data);
      }
    } catch (err) {
    } finally {
      setDetailsLoading(false);
    }
  };

  const openEditModal = (u) => {
    setEditModalUser(u);
    setEditForm({
      display_name: u.display_name,
      email: u.email,
      role: u.role,
      password: '',
    });
    setModalError('');
    setShowEditPassword(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;

    if (!editForm.display_name.trim()) {
      setModalError('Display name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim() || !emailRegex.test(editForm.email.trim())) {
      setModalError('Please provide a valid email address.');
      return;
    }

    if (editForm.password && editForm.password.trim().length > 0) {
      if (editForm.password.length < 8) {
        setModalError('New temporary password must be at least 8 characters long.');
        return;
      }
      if (editForm.password.length > 128) {
        setModalError('Temporary password cannot exceed 128 characters.');
        return;
      }
    }

    setModalLoading(true);
    setModalError('');
    try {
      const payload = {
        display_name: editForm.display_name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
      };
      if (editForm.password && editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await userService.updateUser(editModalUser.user_id, payload);
      if (res?.success) {
        setEditModalUser(null);
        showNotification(
          `User "${editForm.display_name}" updated. A re-verification email has been dispatched to ${editForm.email.trim()}.`
        );
        fetchUsers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDeactivateModal = (targetUser) => {
    if (targetUser.user_id === currentUser?.user_id) {
      alert('Administrators cannot deactivate their own account.');
      return;
    }
    setDeactivateModalUser(targetUser);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateModalUser) return;

    setModalLoading(true);
    try {
      const res = await userService.updateUserStatus(deactivateModalUser.user_id, false);
      if (res?.success) {
        showNotification(
          `Account for "${deactivateModalUser.display_name}" has been deactivated. A notification email has been dispatched.`
        );
        setDeactivateModalUser(null);
        if (detailsModalUser && detailsModalUser.user_id === deactivateModalUser.user_id) {
          setDetailsModalUser({ ...detailsModalUser, is_active: 0, status: 'INACTIVE' });
        }
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to deactivate user.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleActivateUser = async (targetUser) => {
    try {
      const res = await userService.updateUserStatus(targetUser.user_id, true);
      if (res?.success) {
        showNotification(`Account for "${targetUser.display_name}" has been activated successfully.`);
        if (detailsModalUser && detailsModalUser.user_id === targetUser.user_id) {
          setDetailsModalUser({ ...detailsModalUser, is_active: 1, status: 'ACTIVE' });
        }
        fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to activate user.');
    }
  };

  const totalUsers = pagination.total || users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const activeCount = users.filter(
    (u) => u.status === 'ACTIVE' || (u.is_active && u.status !== 'PENDING' && u.status !== 'INACTIVE')
  ).length;
  const pendingCount = users.filter((u) => u.status === 'PENDING').length;

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active' && u.status !== 'ACTIVE' && !(u.is_active && u.status !== 'INACTIVE')) return false;
    if (statusFilter === 'pending' && u.status !== 'PENDING') return false;
    if (statusFilter === 'inactive' && u.status !== 'INACTIVE' && Boolean(u.is_active)) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  const renderStatusBadge = (user) => {
    const isPending = user.status === 'PENDING';
    const isActive = user.status === 'ACTIVE' || (Boolean(user.is_active) && !isPending && user.status !== 'INACTIVE');

    if (isPending) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="text-xs font-normal">Pending</span>
        </div>
      );
    }

    if (isActive) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-normal">Active</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
        <span className="text-xs font-normal">Inactive</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-900 dark:text-white tracking-tight leading-none">
          User & Role Management
        </h1>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal border border-slate-200/90 dark:border-slate-800 rounded-full transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 active:scale-[0.98] text-white text-xs font-normal rounded-full transition-all shadow-sm border border-neutral-800 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-rose-300" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-normal">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 ring-4 ring-neutral-100/60 dark:ring-neutral-800/40">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block truncate">
              Total Users
            </span>
            <span className="text-lg sm:text-xl font-normal text-slate-900 dark:text-white leading-none mt-1 block">
              {totalUsers}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 ring-4 ring-rose-50/60 dark:ring-rose-950/30">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block truncate">
              Administrators
            </span>
            <span className="text-lg sm:text-xl font-normal text-rose-700 dark:text-rose-400 leading-none mt-1 block">
              {adminCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-emerald-50/60 dark:ring-emerald-950/40">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block truncate">
              Active Accounts
            </span>
            <span className="text-lg sm:text-xl font-normal text-emerald-600 dark:text-emerald-400 leading-none mt-1 block">
              {activeCount}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-4 ring-amber-50/60 dark:ring-amber-950/40">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 block truncate">
              Pending Verification
            </span>
            <span className="text-lg sm:text-xl font-normal text-amber-600 dark:text-amber-400 leading-none mt-1 block">
              {pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-normal text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-normal text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:border-neutral-400 dark:focus:border-rose-900/50 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="pending">Pending Only</option>
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

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-neutral-400 dark:focus:border-rose-900/50 focus:outline-none pl-8 pr-4 py-1.5 text-xs text-slate-900 dark:text-white rounded-full transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full border border-neutral-800 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-28">User ID</th>
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
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                    <span>Loading directory from API...</span>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isActive = Boolean(u.is_active);
                  const isCurrent = u.user_id === currentUser?.user_id;
                  const displayId = u.formatted_user_id || formatUserId(u.user_id);
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
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 font-normal">
                        {displayId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white font-normal flex items-center justify-center text-xs shadow-xs shrink-0 ring-1 ring-neutral-800 border border-rose-900/40"
                            style={{ borderRadius: '9999px' }}
                          >
                            {u.display_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-normal text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.display_name}</span>
                              {isCurrent && (
                                <span
                                  className="text-[9px] font-mono font-normal bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.2 rounded-full border border-rose-200/50 dark:border-rose-900/50"
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

                      <td className="py-3 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="text-xs font-normal text-rose-700 dark:text-rose-400">
                            Administrator
                          </span>
                        ) : (
                          <span className="text-xs font-normal text-slate-600 dark:text-slate-300">
                            Staff Member
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {renderStatusBadge(u)}
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
                          <button
                            onClick={() => openDetailsModal(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs font-normal transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          >
                            Edit
                          </button>

                          {isActive ? (
                            <button
                              disabled={isCurrent}
                              onClick={() => handleOpenDeactivateModal(u)}
                              className="px-3 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isCurrent ? 'Self-deactivation is blocked' : 'Deactivate user account'}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(u)}
                              className="px-3 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/40"
                              title="Activate user account"
                            >
                              Activate
                            </button>
                          )}
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

      {/* Details Slide-Over (Send Reset Email button completely removed) */}
      {detailsModalUser && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 transition-opacity animate-fadeIn"
            onClick={() => setDetailsModalUser(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-rose-950/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-black via-neutral-900 to-rose-950 text-white font-normal flex items-center justify-center text-sm shadow-xs ring-1 ring-neutral-800 border border-rose-900/40 shrink-0"
                  style={{ borderRadius: '9999px' }}
                >
                  {detailsModalUser.display_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-normal text-slate-900 dark:text-white flex items-center gap-2 truncate">
                    <span>{detailsModalUser.display_name}</span>
                    {detailsModalUser.user_id === currentUser?.user_id && (
                      <span
                        className="text-[9px] font-mono font-normal bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-900/50"
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

            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {detailsLoading && (
                <div className="flex items-center gap-2 text-rose-600 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading fresh API record...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-normal block mb-1">
                    System Role
                  </span>
                  <span className="text-xs font-normal text-slate-800 dark:text-slate-200">
                    {detailsModalUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-normal block mb-1">
                    Account Status
                  </span>
                  <div>{renderStatusBadge(detailsModalUser)}</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-normal uppercase text-slate-400 tracking-wider block">
                  Audit & Session Details
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">User ID:</span>
                    <span className="font-mono font-normal">
                      {detailsModalUser.formatted_user_id || formatUserId(detailsModalUser.user_id)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Login:</span>
                    <span className="font-normal">
                      {detailsModalUser.last_login_at
                        ? new Date(detailsModalUser.last_login_at).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Account Created:</span>
                    <span className="font-normal">
                      {detailsModalUser.created_at
                        ? new Date(detailsModalUser.created_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Last Updated:</span>
                    <span className="font-normal">
                      {detailsModalUser.updated_at
                        ? new Date(detailsModalUser.updated_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-normal text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
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

            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const u = detailsModalUser;
                  setDetailsModalUser(null);
                  openEditModal(u);
                }}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-normal rounded-full hover:bg-slate-50 cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setDetailsModalUser(null)}
                className="px-5 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white font-normal rounded-full border border-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Create User Slide-Over */}
      {createModalOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 transition-opacity animate-fadeIn"
            onClick={() => setCreateModalOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-rose-950/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50/60 dark:ring-rose-950/40">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-normal text-slate-900 dark:text-white leading-tight">
                    Create User Account
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    A verification email with credentials will be dispatched.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="create-user-form" onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-normal">{modalError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nimal Silva"
                  value={createForm.display_name}
                  onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. nimal@sklabaphone.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters (Argon2id)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 pr-11 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all font-mono shadow-2xs"
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
                  Sent to user's email. The user must verify the account and set their permanent password.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Assigned Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all cursor-pointer shadow-2xs"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span className="leading-relaxed">
                  Initial account status will be <strong>Pending</strong>. It will become <strong>Active</strong> as soon as the user completes email verification.
                </span>
              </div>
            </form>

            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={modalLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full disabled:opacity-50 cursor-pointer shadow-sm border border-neutral-800 transition-all"
              >
                {modalLoading ? 'Creating & Sending Email...' : 'Create Account & Send Email'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Edit User Slide-Over (Email is editable now!) */}
      {editModalUser && createPortal(
        <>
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 transition-opacity animate-fadeIn"
            onClick={() => setEditModalUser(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-rose-950/30 shadow-2xl flex flex-col justify-between overflow-hidden animate-slideInRight">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50/60 dark:ring-rose-950/40">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-normal text-slate-900 dark:text-white leading-tight">
                    Edit User Profile ({editModalUser.formatted_user_id || formatUserId(editModalUser.user_id)})
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Updating email, name, or role triggers a re-verification email.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="edit-user-form" onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6 text-xs overflow-y-auto flex-1">
              {modalError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-normal">{modalError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5 leading-relaxed">
                  Admin can update user email. Changing email sends a verification link to the new address.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  Role Permission
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

              <div className="space-y-2">
                <label className="block text-xs font-normal text-slate-700 dark:text-slate-200 tracking-wide">
                  New Temporary Password <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Leave empty to auto-generate temporary password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 pr-11 text-xs text-slate-900 dark:text-white rounded-xl focus:border-neutral-400 dark:focus:border-rose-900/50 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                    title={showEditPassword ? 'Hide password' : 'Show password'}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span className="leading-relaxed">
                  Saving modifications will reset account status to <strong>Pending</strong> and send a verification email with temporary credentials to the user.
                </span>
              </div>
            </form>

            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditModalUser(null)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-user-form"
                disabled={modalLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full disabled:opacity-50 cursor-pointer shadow-sm border border-neutral-800 transition-all"
              >
                {modalLoading ? 'Saving & Sending Email...' : 'Save Changes & Send Email'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Deactivate User Confirmation Modal (No blur, Black & Red mix theme border) */}
      {deactivateModalUser && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 transition-opacity animate-fadeIn"
            onClick={() => setDeactivateModalUser(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-rose-900/60 ring-1 ring-rose-600/30 rounded-2xl shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-50/60 dark:ring-rose-950/40">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-normal text-slate-900 dark:text-white leading-tight">
                  Deactivate User Account
                </h3>
                <span className="text-xs font-mono text-slate-400 block mt-0.5">
                  {deactivateModalUser.formatted_user_id || formatUserId(deactivateModalUser.user_id)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Are you sure you want to deactivate the account for{' '}
                <strong className="text-slate-900 dark:text-white font-normal">
                  "{deactivateModalUser.display_name}"
                </strong>{' '}
                (<span className="font-mono text-slate-500">{deactivateModalUser.email}</span>)?
              </p>
              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300">
                <p className="font-normal mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Immediate effect & Notification:</span>
                </p>
                <p>
                  Active sessions will be immediately terminated, and an official email stating{' '}
                  <em>"Your account has been deactivated. Contact admins for more details. Thank you."</em>{' '}
                  will be dispatched to <strong>{deactivateModalUser.email}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeactivateModalUser(null)}
                className="px-5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-normal rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modalLoading}
                onClick={handleConfirmDeactivate}
                className="px-6 py-2 bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white text-xs font-normal rounded-full border border-neutral-800 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                {modalLoading ? 'Deactivating & Sending Email...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
