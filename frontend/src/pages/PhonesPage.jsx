// ============================================================
// PHONES PAGE — Full CRUD with filters (brand, status, condition, availability, search)
// ============================================================

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAllPhones,
  createPhone,
  updatePhone,
  deletePhone,
} from '../actions/phoneActions'
import { clearPhoneState } from '../reducers/phoneReducer'
import { fetchAllBrands } from '../actions/brandActions'
import {
  PHONE_TABLE_HEADERS,
  PHONE_CONDITION_OPTIONS,
  PHONE_STATUS_OPTIONS,
  PHONE_AVAILABILITY_OPTIONS,
  PHONE_STATUS_COLORS,
  PHONE_AVAILABILITY_COLORS,
  PHONE_CONDITION_COLORS,
} from '../constants/phoneConstants'
import { COLORS } from '../constants/colors'
import { TYPOGRAPHY } from '../constants/typography'
import { SPACING } from '../constants/spacing'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const formatPrice = (p) =>
  p ? `$${Number(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'

const EMPTY_FORM = {
  name: '',
  brand_id: '',
  phone_condition: 'NEW',
  price: '',
  low_stock_level: '',
  stock_quantity: '',
  availability: 'IN_STOCK',
  status: 'DRAFT',
  warranty: '',
  description: '',
  colour_options: '',
  installment_enabled: false,
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

// ── Phone Modal ───────────────────────────────────────────────
function PhoneModal({ open, onClose, onSubmit, initial, loading, brands }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        brand_id: initial.brand_id || '',
        phone_condition: initial.phone_condition || 'NEW',
        price: initial.price || '',
        low_stock_level: initial.low_stock_level ?? initial.stock_quantity ?? '',
        stock_quantity: initial.low_stock_level ?? initial.stock_quantity ?? '',
        availability: initial.availability || 'IN_STOCK',
        status: initial.status || 'DRAFT',
        warranty: initial.warranty || '',
        description: initial.description || '',
        colour_options: Array.isArray(initial.colour_options)
          ? initial.colour_options.join(', ')
          : initial.colour_options || '',
        installment_enabled: !!initial.installment_enabled,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [initial, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.brand_id || !form.price) return
    const payload = {
      ...form,
      brand_id: Number(form.brand_id),
      price: Number(form.price),
      low_stock_level: Number(form.low_stock_level),
      stock_quantity: Number(form.low_stock_level),
      colour_options: form.colour_options
        ? form.colour_options.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
    }
    onSubmit(payload)
  }

  const field = (label, key, type = 'text', placeholder = '', required = false) => (
    <div className={SPACING.formGroup}>
      <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        required={required}
        min={type === 'number' ? 0 : undefined}
        className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
    </div>
  )

  const selectField = (label, key, options, required = false) => (
    <div className={SPACING.formGroup}>
      <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={required}
        className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className={`${SPACING.modalHeader} border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10`}>
          <h2 className={TYPOGRAPHY.modalTitle}>
            {initial ? '✏️ Edit Phone' : '➕ New Phone'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className={SPACING.modal}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {/* Name */}
            <div className={`${SPACING.formGroup} sm:col-span-2`}>
              <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
                Phone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. iPhone 15 Pro Max"
                required
                className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Brand */}
            <div className={SPACING.formGroup}>
              <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                required
                className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
              >
                <option value="">Select brand...</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            {selectField('Condition', 'phone_condition', PHONE_CONDITION_OPTIONS, true)}

            {/* Price */}
            {field('Price (USD)', 'price', 'number', '0.00', true)}

            {/* Stock */}
            {field('Low Stock Level', 'low_stock_level', 'number', '5')}

            {/* Status */}
            {selectField('Status', 'status', PHONE_STATUS_OPTIONS)}

            {/* Availability */}
            {selectField('Availability', 'availability', PHONE_AVAILABILITY_OPTIONS)}

            {/* Warranty */}
            {field('Warranty', 'warranty', 'text', 'e.g. 1 Year Apple Warranty')}

            {/* Colours */}
            <div className={`${SPACING.formGroup} sm:col-span-2`}>
              <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>
                Colour Options <span className={TYPOGRAPHY.helperText}>(comma separated)</span>
              </label>
              <input
                type="text"
                value={form.colour_options}
                onChange={(e) => setForm({ ...form, colour_options: e.target.value })}
                placeholder="Natural Titanium, Blue Titanium, Black Titanium"
                className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Description */}
            <div className={`${SPACING.formGroup} sm:col-span-2`}>
              <label className={`block ${TYPOGRAPHY.label} ${SPACING.formLabel}`}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Phone description..."
                rows={3}
                className={`w-full ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              />
            </div>

            {/* Installment */}
            <div className="sm:col-span-2 flex items-center gap-3 mb-4">
              <button
                type="button"
                role="switch"
                aria-checked={form.installment_enabled}
                onClick={() => setForm({ ...form, installment_enabled: !form.installment_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.installment_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.installment_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={TYPOGRAPHY.label}>Installment Enabled</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className={`${SPACING.btn} rounded-lg ${COLORS.gray.cancelBtn} ${TYPOGRAPHY.btnText}`}>Cancel</button>
            <button type="submit" disabled={loading} className={`${SPACING.btn} rounded-lg ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} disabled:opacity-60`}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Phone'}
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
          <h2 className={TYPOGRAPHY.modalTitle}>Delete Phone</h2>
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
export default function PhonesPage() {
  const dispatch = useDispatch()
  const { list, loading, error, success, message } = useSelector((s) => s.phones)
  const { list: brands } = useSelector((s) => s.brands)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')

  useEffect(() => {
    dispatch(fetchAllBrands())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchAllPhones({
      search: search || undefined,
      brand_id: brandFilter || undefined,
      status: statusFilter || undefined,
      phone_condition: conditionFilter || undefined,
      availability: availabilityFilter || undefined,
    }))
  }, [dispatch, search, brandFilter, statusFilter, conditionFilter, availabilityFilter])

  useEffect(() => {
    if (success) {
      setToast({ message, type: 'success' })
      setModalOpen(false)
      setDeleteTarget(null)
      dispatch(clearPhoneState())
      dispatch(fetchAllPhones())
      setTimeout(() => setToast(null), 3000)
    }
    if (error) {
      setToast({ message: error, type: 'error' })
      dispatch(clearPhoneState())
      setTimeout(() => setToast(null), 4000)
    }
  }, [success, error, message, dispatch])

  return (
    <div>
      <Toast message={toast?.message} type={toast?.type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className={TYPOGRAPHY.sectionTitle}>All Phones</h2>
          <p className={TYPOGRAPHY.countText}>{list.length} phone{list.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => { setEditTarget(null); setModalOpen(true) }} className={`${SPACING.btn} rounded-xl ${COLORS.brand.btn} ${TYPOGRAPHY.btnText} flex items-center gap-2 shadow-sm`}>
          <span>+</span> Add Phone
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search phones..."
          className={`flex-1 min-w-[180px] ${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={`${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}>
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}>
          <option value="">All Status</option>
          {PHONE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className={`${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}>
          <option value="">All Conditions</option>
          {PHONE_CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className={`${SPACING.input} border border-gray-300 rounded-lg ${TYPOGRAPHY.inputText} focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}>
          <option value="">All Availability</option>
          {PHONE_AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && list.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📱</p>
            <p className={TYPOGRAPHY.emptyState}>No phones found. Add your first phone!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {PHONE_TABLE_HEADERS.map((h) => (
                    <th key={h} className={`${SPACING.tableHeader} text-left ${TYPOGRAPHY.tableHeader}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((phone, idx) => (
                  <tr key={phone.phone_id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} text-gray-400`}>{idx + 1}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCellBold} whitespace-nowrap`}>{phone.name}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell} whitespace-nowrap`}>{phone.brand_name || '—'}</td>
                    <td className={SPACING.tableCell}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PHONE_CONDITION_COLORS[phone.phone_condition] || 'bg-gray-100 text-gray-600'}`}>
                        {phone.phone_condition}
                      </span>
                    </td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCellBold} whitespace-nowrap`}>{formatPrice(phone.price)}</td>
                    <td className={`${SPACING.tableCell} ${TYPOGRAPHY.tableCell}`}>{phone.low_stock_level ?? phone.stock_quantity ?? '—'}</td>
                    <td className={SPACING.tableCell}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PHONE_STATUS_COLORS[phone.status] || 'bg-gray-100 text-gray-600'}`}>
                        {phone.status}
                      </span>
                    </td>
                    <td className={SPACING.tableCell}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PHONE_AVAILABILITY_COLORS[phone.availability] || 'bg-gray-100 text-gray-600'}`}>
                        {phone.availability?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={SPACING.tableCell}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditTarget(phone); setModalOpen(true) }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">✏️ Edit</button>
                        <button onClick={() => setDeleteTarget(phone)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PhoneModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        onSubmit={(form) =>
          editTarget
            ? dispatch(updatePhone({ id: editTarget.phone_id, data: form }))
            : dispatch(createPhone(form))
        }
        initial={editTarget}
        loading={loading}
        brands={brands}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch(deletePhone(deleteTarget.phone_id))}
        name={deleteTarget?.name}
        loading={loading}
      />
    </div>
  )
}
