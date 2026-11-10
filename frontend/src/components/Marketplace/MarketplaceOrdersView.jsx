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
  PAYMENT_PENDING: { label: 'Payment Pending', dot: 'bg-amber-500' },
  PAYMENT_RECEIVED: { label: 'Payment Received (Escrow)', dot: 'bg-sky-500' },
  NOTIFIED_SELLER: { label: 'Seller Notified', dot: 'bg-blue-500' },
  DELIVERY_CONFIRMED: { label: 'Delivery Confirmed', dot: 'bg-indigo-500' },
  PHONE_VERIFIED: { label: 'Phone Verified', dot: 'bg-emerald-500' },
  SELLER_PAID: { label: 'Seller Payout Released', dot: 'bg-purple-500' },
  COMPLETED: { label: 'Order Completed', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-slate-400' },
  VERIFICATION_FAILED: { label: 'Verification Failed', dot: 'bg-rose-500' },
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
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          <label className="text-xs font-normal text-slate-600 dark:text-slate-400">Order Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-normal px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
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
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-normal text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          title="Refresh orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs font-normal text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-normal text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Order Ref</th>
                <th className="px-4 py-3">Phone Listing</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Fee (5%)</th>
                <th className="px-4 py-3 text-right">Seller Payout</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-normal">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                    <span>Loading marketplace orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-normal">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <span>No marketplace orders found.</span>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusInfo = ORDER_STATUS_CONFIG[o.status] || {
                    label: o.status,
                    dot: 'bg-slate-400',
                  };
                  return (
                    <tr key={o.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-normal font-mono text-slate-900 dark:text-white">
                        {o.order_ref || `#${o.order_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-normal text-slate-900 dark:text-white block">
                          {o.brand} {o.model}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {o.storage} • {o.condition_grade?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-normal text-slate-800 dark:text-slate-200 block">
                          {o.buyer_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">{o.buyer_phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-normal text-slate-800 dark:text-slate-200 block">
                          {o.seller_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">{o.seller_phone}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-normal text-slate-900 dark:text-white">
                        {formatCurrency(o.total_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-normal text-slate-600 dark:text-slate-400">
                        {formatCurrency(o.commission_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-normal text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(o.net_seller_payout)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-900 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        {o.status === 'PAYMENT_PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'PAYMENT_RECEIVED')}
                            disabled={updatingId === o.order_id}
                            className="px-3 py-1 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            Confirm Payment
                          </button>
                        )}
                        {o.status === 'PAYMENT_RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'DELIVERY_CONFIRMED')}
                            disabled={updatingId === o.order_id}
                            className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Confirm Delivery
                          </button>
                        )}
                        {o.status === 'DELIVERY_CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'PHONE_VERIFIED')}
                            disabled={updatingId === o.order_id}
                            className="px-3 py-1 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            Verify Phone
                          </button>
                        )}
                        {o.status === 'PHONE_VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'SELLER_PAID')}
                            disabled={updatingId === o.order_id}
                            className="px-3 py-1 text-xs font-normal rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Release Payout
                          </button>
                        )}
                        {o.status === 'SELLER_PAID' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(o.order_id, 'COMPLETED')}
                            disabled={updatingId === o.order_id}
                            className="px-3 py-1 text-xs font-normal rounded-full bg-gradient-to-r from-black via-neutral-900 to-rose-950 hover:to-rose-900 text-white border border-neutral-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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
