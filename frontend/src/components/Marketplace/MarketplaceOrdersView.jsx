import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import marketplaceAdminService from '../../services/marketplaceAdminService';

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-US');
}

const ORDER_STATUS_CONFIG = {
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400' },
  PAYMENT_RECEIVED: { label: 'Payment Received (Escrow)', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400' },
  NOTIFIED_SELLER: { label: 'Seller Notified', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400' },
  DELIVERY_CONFIRMED: { label: 'Delivery Confirmed', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400' },
  PHONE_VERIFIED: { label: 'Phone Verified', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' },
  SELLER_PAID: { label: 'Seller Payout Released', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400' },
  COMPLETED: { label: 'Order Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  VERIFICATION_FAILED: { label: 'Verification Failed', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400' },
};

export default function MarketplaceOrdersView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await marketplaceAdminService.getOrders(statusFilter ? { status: statusFilter } : {});
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load marketplace orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    if (!window.confirm(`Transition order to "${nextStatus.replace(/_/g, ' ')}"?`)) return;
    setUpdatingId(orderId);
    try {
      await marketplaceAdminService.updateOrderStatus(orderId, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Order Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Orders</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="PAYMENT_RECEIVED">Payment Received</option>
            <option value="DELIVERY_CONFIRMED">Delivery Confirmed</option>
            <option value="PHONE_VERIFIED">Phone Verified</option>
            <option value="SELLER_PAID">Seller Paid</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Order Ref</th>
                <th className="px-4 py-3.5">Phone Listing</th>
                <th className="px-4 py-3.5">Buyer</th>
                <th className="px-4 py-3.5">Seller</th>
                <th className="px-4 py-3.5 text-right">Price</th>
                <th className="px-4 py-3.5 text-right">Fee (5%)</th>
                <th className="px-4 py-3.5 text-right">Seller Payout</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    <span>Loading marketplace orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No marketplace orders found.</span>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusInfo = ORDER_STATUS_CONFIG[o.status] || {
                    label: o.status,
                    color: 'bg-slate-100 text-slate-700',
                  };
                  return (
                    <tr key={o.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {o.order_ref || `#${o.order_id}`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {o.brand} {o.model}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {o.storage} • {o.condition_grade?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {o.buyer_name}
                        </span>
                        <span className="text-[10px] text-slate-400">{o.buyer_phone}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {o.seller_name}
                        </span>
                        <span className="text-[10px] text-slate-400">{o.seller_phone}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(o.total_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-400">
                        {formatCurrency(o.commission_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(o.net_seller_payout)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        {o.status === 'PAYMENT_PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'PAYMENT_RECEIVED')}
                            disabled={updatingId === o.order_id}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-semibold text-[10px] hover:bg-sky-700"
                          >
                            Confirm Payment
                          </button>
                        )}
                        {o.status === 'PAYMENT_RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'DELIVERY_CONFIRMED')}
                            disabled={updatingId === o.order_id}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[10px] hover:bg-indigo-700"
                          >
                            Confirm Delivery
                          </button>
                        )}
                        {o.status === 'DELIVERY_CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'PHONE_VERIFIED')}
                            disabled={updatingId === o.order_id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700"
                          >
                            Verify Phone
                          </button>
                        )}
                        {o.status === 'PHONE_VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'SELLER_PAID')}
                            disabled={updatingId === o.order_id}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-semibold text-[10px] hover:bg-purple-700"
                          >
                            Release Payout
                          </button>
                        )}
                        {o.status === 'SELLER_PAID' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'COMPLETED')}
                            disabled={updatingId === o.order_id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-semibold text-[10px] hover:bg-emerald-800"
                          >
                            Complete Order
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
