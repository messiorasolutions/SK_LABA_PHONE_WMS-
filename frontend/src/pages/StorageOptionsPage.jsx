// ============================================================
// STORAGE OPTIONS PAGE — Full CRUD
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAllStorageOptions,
  createStorageOption,
  updateStorageOption,
  deleteStorageOption,
} from '../actions/storageActions'
import { clearStorageState } from '../reducers/storageReducer'
import { STORAGE_TABLE_HEADERS } from '../constants/storageConstants'
import { COLORS } from '../constants/colors'
import { TYPOGRAPHY } from '../constants/typography'
import { SPACING } from '../constants/spacing'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const EMPTY_FORM = { storage_name: '', capacity_gb: '' }

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${type === 'error' ? COLORS.danger.alert : COLORS.success.alert}`}>
      <span>{type === 'error' ? '❌' : '✅'}</span>{message}
    </div>
  )
}

// ── Storage Modal ─────────────────────────────────────────────
function StorageModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    setForm(initial ? { storage_name: initial.storage_name, capacity_gb: initial.capacity_gb } : EMPTY_FORM)
  }, [initial, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.storage_name.trim() || !form.capacity_gb) return
    onSubmit({ ...form, capacity_gb: Number(form.capacity_gb) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className={`${SPACING.modalHeader} border-b border-gray-100 flex items-center justify-between`}>
          <h2 className={TYPOGRAPHY.modalTitle}>
            {initial ? '✏️ Edit Storage Option' : '➕ New Storage Option'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className={SPACING.modal}>
          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Storage Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.storage_name}
              onChange={(e) => setForm({ ...form, storage_name: e.target.value })}
              placeholder="e.g. 128GB"
              required
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Capacity (GB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.capacity_gb}
              onChange={(e) => setForm({ ...form, capacity_gb: e.target.value })}
              placeholder="e.g. 128"
              min={1}
              required
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText} transition-colors`}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`${SPACING.btn} rounded-lg ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} transition-colors disabled:opacity-60`}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, name, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">🗑️</div>
          <h2 className={TYPOGRAPHY.modalTitle}>Delete Storage Option</h2>
        </div>
        <p className={`${TYPOGRAPHY.subtext} mb-6`}>
          Delete <strong className="text-gray-800">{name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText}`}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`${SPACING.btn} rounded-lg ${COLORS.danger.btn} ${TYPOGRAPHY.btnText} disabled:opacity-60`}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function StorageOptionsPage() {
  const dispatch = useDispatch()
  const { list, loading, error, success, message } = useSelector((s) => s.storage)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { dispatch(fetchAllStorageOptions()) }, [dispatch])

  useEffect(() => {
    if (success) {
      setToast({ message, type: 'success' })
      setModalOpen(false)
      setDeleteTarget(null)
      dispatch(clearStorageState())
      setTimeout(() => setToast(null), 3000)
    }
    if (error) {
      setToast({ message: error, type: 'error' })
      dispatch(clearStorageState())
      setTimeout(() => setToast(null), 4000)
    }
  }, [success, error, message, dispatch])

  const handleCreate = (form) => dispatch(createStorageOption(form))
  const handleUpdate = (form) => dispatch(updateStorageOption({ id: editTarget.storage_id, data: form }))
  const handleDelete = () => dispatch(deleteStorageOption(deleteTarget.storage_id))

  const filtered = list.filter((s) =>
    s.storage_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={TYPOGRAPHY.sectionTitle}>All Storage Options</h2>
          <p className={TYPOGRAPHY.countText}>{list.length} option{list.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true) }} className={`${SPACING.btn} rounded-xl ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} flex items-center gap-2 shadow-sm`}>
          <span>+</span> Add Storage
        </button>
      </div>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search storage options..." className={`w-full sm:w-72 ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💾</p>
            <p className={TYPOGRAPHY.emptyState}>{search ? 'No matches found.' : 'No storage options yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {STORAGE_TABLE_HEADERS.map((h) => (
                    <th key={h} className={`${SPACING.tableHeader} text-left ${TYPOGRAPHY.tableHeader}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, idx) => (
                  <tr key={s.storage_id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} text-gray-400`}>{idx + 1}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCellBold}`}>{s.storage_name}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell}`}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {s.capacity_gb} GB
                      </span>
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell}`}>{formatDate(s.created_at)}</td>
                    <td className={SPACING.tableCell}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditTarget(s); setModalOpen(true) }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">✏️ Edit</button>
                        <button onClick={() => setDeleteTarget(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StorageModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        initial={editTarget}
        loading={loading}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.storage_name}
        loading={loading}
      />
    </div>
  )
}
