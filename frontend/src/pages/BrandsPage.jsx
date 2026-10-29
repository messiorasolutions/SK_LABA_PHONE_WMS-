// ============================================================
// BRANDS PAGE — Full CRUD (List, Create, Edit, Delete)
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../actions/brandActions'
import { clearBrandState } from '../reducers/brandReducer'
import {
  BRAND_TABLE_HEADERS,
  BRAND_STATUS_LABELS,
} from '../constants/brandConstants'
import { COLORS } from '../constants/colors'
import { TYPOGRAPHY } from '../constants/typography'
import { SPACING } from '../constants/spacing'

// ── Helpers ──────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const EMPTY_FORM = { brand_name: '', description: '', is_active: true }

// ── Brand Modal ───────────────────────────────────────────────
function BrandModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    setForm(initial ? { ...initial, is_active: initial.is_active === 1 || initial.is_active === true } : EMPTY_FORM)
  }, [initial, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.brand_name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className={`${SPACING.modalHeader} border-b border-gray-100 flex items-center justify-between`}>
          <h2 className={TYPOGRAPHY.modalTitle}>
            {initial ? '✏️ Edit Brand' : '➕ New Brand'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={SPACING.modal}>
          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
              placeholder="e.g. Apple"
              required
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description about the brand..."
              rows={3}
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.is_active ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={TYPOGRAPHY.label}>
              {form.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${SPACING.btn} rounded-lg ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm Delete Dialog ─────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, brandName, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl">
            🗑️
          </div>
          <h2 className={TYPOGRAPHY.modalTitle}>Delete Brand</h2>
        </div>
        <p className={`${TYPOGRAPHY.subtext} mb-6`}>
          Are you sure you want to delete{' '}
          <strong className="text-gray-800">{brandName}</strong>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${SPACING.btn} rounded-lg ${COLORS.danger.btn} ${TYPOGRAPHY.btnText} transition-colors disabled:opacity-60`}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast Notification ────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null
  return (
    <div
      className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
        type === 'error' ? COLORS.danger.alert : COLORS.success.alert
      }`}
    >
      <span>{type === 'error' ? '❌' : '✅'}</span>
      {message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function BrandsPage() {
  const dispatch = useDispatch()
  const { list, loading, error, success, message } = useSelector(
    (state) => state.brands
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchAllBrands())
  }, [dispatch])

  // Handle success/error toasts
  useEffect(() => {
    if (success) {
      setToast({ message, type: 'success' })
      setModalOpen(false)
      setDeleteTarget(null)
      dispatch(clearBrandState())
      setTimeout(() => setToast(null), 3000)
    }
    if (error) {
      setToast({ message: error, type: 'error' })
      dispatch(clearBrandState())
      setTimeout(() => setToast(null), 4000)
    }
  }, [success, error, message, dispatch])

  const handleCreate = (form) => dispatch(createBrand(form))

  const handleEdit = (brand) => {
    setEditTarget(brand)
    setModalOpen(true)
  }

  const handleUpdate = (form) =>
    dispatch(updateBrand({ id: editTarget.brand_id, data: form }))

  const handleDelete = () =>
    dispatch(deleteBrand(deleteTarget.brand_id))

  const openCreate = () => {
    setEditTarget(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
  }

  // Filter
  const filtered = list.filter((b) =>
    b.brand_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} />

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={TYPOGRAPHY.sectionTitle}>All Brands</h2>
          <p className={TYPOGRAPHY.countText}>{list.length} brand{list.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={openCreate}
          className={`${SPACING.btn} rounded-xl ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} flex items-center gap-2 shadow-sm`}
        >
          <span>+</span> Add Brand
        </button>
      </div>

      {/* ── Search ── */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands..."
          className={`w-full sm:w-72 ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🏷️</p>
            <p className={TYPOGRAPHY.emptyState}>
              {search ? 'No brands match your search.' : 'No brands yet. Add your first brand!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {BRAND_TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className={`${SPACING.tableHeader} text-left ${TYPOGRAPHY.tableHeader}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((brand, idx) => (
                  <tr key={brand.brand_id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} text-gray-400`}>
                      {idx + 1}
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCellBold}`}>
                      {brand.brand_name}
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} max-w-xs truncate`}>
                      {brand.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td className={SPACING.tableCell}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${TYPOGRAPHY.badgeText} ${
                          brand.is_active === 1 || brand.is_active === true
                            ? COLORS.success.badge
                            : COLORS.danger.badge
                        }`}
                        style={{ borderRadius: '9999px' }}
                      >
                        <span
                          className={`inline-block rounded-full shrink-0 ${
                            brand.is_active === 1 || brand.is_active === true ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{
                            borderRadius: '50%',
                            width: '6px',
                            height: '6px',
                            minWidth: '6px',
                            minHeight: '6px',
                          }}
                        />
                        <span>{BRAND_STATUS_LABELS[brand.is_active] ?? 'Unknown'}</span>
                      </span>
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell}`}>
                      {formatDate(brand.created_at)}
                    </td>
                    <td className={SPACING.tableCell}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(brand)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <BrandModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        initial={editTarget}
        loading={loading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        brandName={deleteTarget?.brand_name}
        loading={loading}
      />
    </div>
  )
}
