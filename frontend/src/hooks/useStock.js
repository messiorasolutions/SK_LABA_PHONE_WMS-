import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBrands } from '../actions/brandActions';
import PhoneService from '../services/phoneService';

export default function useStock() {
  const dispatch = useDispatch();

  const { list: brands = [] } = useSelector((state) => state.brands ?? {});

  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modals state
  const [addStockPhone, setAddStockPhone] = useState(null);
  const [removeStockPhone, setRemoveStockPhone] = useState(null);
  const [soldOutPhone, setSoldOutPhone] = useState(null);

  // ST-09 Notification Alert
  const [restorationAlert, setRestorationAlert] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await PhoneService.getStockList({
        search: searchTerm || undefined,
        brand_id: brandFilter || undefined,
        availability: availabilityFilter || undefined,
      });
      const data = response.data?.data || response.data || [];
      setStockList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Load stock list error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load stock list');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, brandFilter, availabilityFilter]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    loadStock();
    showToast('Stock inventory refreshed');
  }, [loadStock, showToast]);

  // ST-05 Add Stock
  const handleAddStock = async ({ quantity, reason, notes, color_name, storage_name }) => {
    if (!addStockPhone?.phone_id) return { success: false, error: 'No phone selected' };
    setSubmitting(true);
    try {
      const res = await PhoneService.addStock(addStockPhone.phone_id, {
        quantity: Number(quantity),
        color_name,
        storage_name,
        reason,
        notes,
      });

      const resData = res.data?.data || res.data;
      const variantLabel = [color_name, storage_name].filter(Boolean).join(' · ');
      showToast(
        variantLabel
          ? `Added ${quantity} units to "${addStockPhone.name}" (${variantLabel})!`
          : `Added ${quantity} units to "${addStockPhone.name}"!`
      );

      // SRS ST-09: Back in stock alert check
      if (resData?.stock_restoration_alert) {
        setRestorationAlert(resData.stock_restoration_alert);
      } else if (resData?.waiting_customers_count > 0) {
        setRestorationAlert({
          phone_id: addStockPhone.phone_id,
          phone_name: addStockPhone.name,
          waiting_customers_count: resData.waiting_customers_count,
          message: `${resData.waiting_customers_count} customer${resData.waiting_customers_count === 1 ? ' is' : 's are'} waiting`,
        });
      }

      setAddStockPhone(null);
      await loadStock();
      return { success: true, data: resData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add stock';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // ST-05 Remove Stock
  const handleRemoveStock = async ({ quantity, reason, notes, color_name, storage_name }) => {
    if (!removeStockPhone?.phone_id) return { success: false, error: 'No phone selected' };
    setSubmitting(true);
    try {
      const res = await PhoneService.removeStock(removeStockPhone.phone_id, {
        quantity: Number(quantity),
        color_name,
        storage_name,
        reason,
        notes,
      });

      const resData = res.data?.data || res.data;
      const remVariantLabel = [color_name, storage_name].filter(Boolean).join(' · ');
      showToast(
        remVariantLabel
          ? `Deducted ${quantity} units from "${removeStockPhone.name}" (${remVariantLabel})!`
          : `Deducted ${quantity} units from "${removeStockPhone.name}"!`
      );
      setRemoveStockPhone(null);
      await loadStock();
      return { success: true, data: resData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to deduct stock';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // ST-05 Mark Sold Out
  const handleMarkSoldOut = async (resetQuantity = true) => {
    if (!soldOutPhone?.phone_id) return { success: false, error: 'No phone selected' };
    setSubmitting(true);
    try {
      const res = await PhoneService.markSoldOut(soldOutPhone.phone_id, resetQuantity);
      const resData = res.data?.data || res.data;
      showToast(`"${soldOutPhone.name}" marked as SOLD OUT`);
      setSoldOutPhone(null);
      await loadStock();
      return { success: true, data: resData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to mark sold out';
      showToast(msg, 'error');
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let soldOutCount = 0;

    stockList.forEach((phone) => {
      const qty = Number(phone.current_stock || 0);
      const threshold = Number(phone.low_stock_level ?? 5);
      totalUnits += qty;

      if (phone.availability === 'SOLD_OUT' || qty <= 0) {
        soldOutCount++;
      } else if (phone.availability === 'LOW_STOCK' || (qty > 0 && qty <= threshold)) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalPhones: stockList.length,
      totalUnits,
      inStockCount,
      lowStockCount,
      soldOutCount,
    };
  }, [stockList]);

  return {
    stockList,
    brands,
    loading,
    submitting,
    error,
    metrics,
    searchTerm,
    setSearchTerm,
    brandFilter,
    setBrandFilter,
    availabilityFilter,
    setAvailabilityFilter,
    addStockPhone,
    setAddStockPhone,
    removeStockPhone,
    setRemoveStockPhone,
    soldOutPhone,
    setSoldOutPhone,
    restorationAlert,
    setRestorationAlert,
    toast,
    showToast,
    handleRefresh,
    handleAddStock,
    handleRemoveStock,
    handleMarkSoldOut,
  };
}

