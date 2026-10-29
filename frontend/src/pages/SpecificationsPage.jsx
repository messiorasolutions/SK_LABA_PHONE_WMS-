// ============================================================
// SPECIFICATIONS PAGE — Full CRUD with type filter
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAllSpecifications,
  createSpecification,
  updateSpecification,
  deleteSpecification,
} from '../actions/specificationActions'
import { clearSpecificationState } from '../reducers/specificationReducer'
import {
  SPECIFICATION_TABLE_HEADERS,
  SPECIFICATION_TYPE_OPTIONS,
} from '../constants/specificationConstants'
import { COLORS } from '../constants/colors'
import { TYPOGRAPHY } from '../constants/typography'
import { SPACING } from '../constants/spacing'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const EMPTY_FORM = {
  specification_name: '',
  specification_type: 'TECHNICAL',
  description: '',
  is_active: true,
}

const TYPE_BADGE = {
  TECHNICAL: 'bg-blue-100 text-blue-700',
  ACCESSORY: 'bg-orange-100 text-orange-700',
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${type === 'error' ? COLORS.danger.alert : COLORS.success.alert}`}>
      <span>{type === 'error' ? '❌' : '✅'}</span>{message}
    </div>
  )
}

// ── Spec Modal ────────────────────────────────────────────────
function SpecModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    setForm(
      initial
        ? {
            specification_name: initial.specification_name,
            specification_type: initial.specification_type,
            description: initial.description || '',
            is_active: initial.is_active === 1 || initial.is_active === true,
          }
        : EMPTY_FORM
    )
  }, [initial, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.specification_name.trim()) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className={`${SPACING.modalHeader} border-b border-gray-100 flex items-center justify-between`}>
          <h2 className={TYPOGRAPHY.modalTitle}>
            {initial ? '✏️ Edit Specification' : '➕ New Specification'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className={SPACING.modal}>
          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.specification_name}
              onChange={(e) => setForm({ ...form, specification_name: e.target.value })}
              placeholder="e.g. Super AMOLED Display 120Hz"
              required
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.specification_type}
              onChange={(e) => setForm({ ...form, specification_type: e.target.value })}
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
            >
              {SPECIFICATION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={SPACING.formGroup}>
            <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..."
              rows={3}
              className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={TYPOGRAPHY.label}>{form.is_active ? 'Active' : 'Inactive'}</span>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText}`}>Cancel</button>
            <button type="submit" disabled={loading} className={`${SPACING.btn} rounded-lg ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} disabled:opacity-60`}>
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
          <h2 className={TYPOGRAPHY.modalTitle}>Delete Specification</h2>
        </div>
        <p className={`${TYPOGRAPHY.subtext} mb-6`}>Delete <strong className="text-gray-800">{name}</strong>? This cannot be undone.</p>
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
export default function SpecificationsPage() {
  const dispatch = useDispatch()
  const { list, loading, error, success, message } = useSelector((s) => s.specifications)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => { dispatch(fetchAllSpecifications(typeFilter)) }, [dispatch, typeFilter])

  useEffect(() => {
    if (success) {
      setToast({ message, type: 'success' })
      setModalOpen(false)
      setDeleteTarget(null)
      dispatch(clearSpecificationState())
      setTimeout(() => setToast(null), 3000)
    }
    if (error) {
      setToast({ message: error, type: 'error' })
      dispatch(clearSpecificationState())
      setTimeout(() => setToast(null), 4000)
    }
  }, [success, error, message, dispatch])

  const handleDelete = () => dispatch(deleteSpecification(deleteTarget.specification_id))

  const filtered = list.filter((s) =>
    s.specification_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={TYPOGRAPHY.sectionTitle}>All Specifications</h2>
          <p className={TYPOGRAPHY.countText}>{list.length} specification{list.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true) }} className={`${SPACING.btn} rounded-xl ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} flex items-center gap-2 shadow-sm`}>
          <span>+</span> Add Specification
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search specifications..."
          className={`w-full sm:w-72 ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={`${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
        >
          <option value="">All Types</option>
          {SPECIFICATION_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">⚙️</p>
            <p className={TYPOGRAPHY.emptyState}>{search ? 'No matches found.' : 'No specifications yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {SPECIFICATION_TABLE_HEADERS.map((h) => (
                    <th key={h} className={`${SPACING.tableHeader} text-left ${TYPOGRAPHY.tableHeader}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, idx) => (
                  <tr key={s.specification_id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} text-gray-400`}>{idx + 1}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCellBold}`}>{s.specification_name}</td>
                    <td className={SPACING.tableCell}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[s.specification_type] || 'bg-gray-100 text-gray-600'}`}>
                        {s.specification_type}
                      </span>
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} max-w-xs truncate`}>{s.description || <span className="text-gray-400">—</span>}</td>
                    <td className={SPACING.tableCell}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.is_active === 1 || s.is_active === true ? COLORS.success.badge : COLORS.danger.badge}`}>
                        {s.is_active === 1 || s.is_active === true ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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

      <SpecModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={(form) =>
          editTarget
            ? dispatch(updateSpecification({ id: editTarget.specification_id, data: form }))
            : dispatch(createSpecification(form))
        }
        initial={editTarget}
        loading={loading}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.specification_name}
        loading={loading}
      />
    </div>
  )
}
