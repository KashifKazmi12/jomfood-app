import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { showToast } from '../components/toast';
import { cartAPI } from '../api/cart';

const CartContext = createContext(null);

const normalizeDeal = (deal, quantity = 1) => {
  if (!deal) return null;
  const businessId = deal?.business_id?._id || deal?.business_id;
  return {
    id: deal._id || deal?.deal_id || deal?.id,
    deal_name: deal.deal_name,
    deal_total: Number(deal.deal_total || 0),
    original_total: Number(deal.original_total || 0),
    deal_type: deal.deal_type,
    deal_image: deal.deal_image,
    consumptionType: Array.isArray(deal.consumptionType)
      ? deal.consumptionType
      : Array.isArray(deal.consumption_type)
        ? deal.consumption_type
        : [],
    start_date: deal.start_date || deal.deal_start_date,
    end_date: deal.end_date || deal.deal_end_date,
    business_id: businessId,
    business_name: deal?.business_id?.company_name || deal?.business_name || '',
    group_id: deal?.group_id?._id || deal?.group_id || '',
    quantity: Number(quantity || 1),
  };
};

export const CartProvider = ({ children }) => {
  const user = useSelector(state => state.auth.user);
  const [items, setItems] = useState([]);
  const [businessId, setBusinessId] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async (customerId) => {
    if (!customerId) {
      setItems([]);
      setBusinessId(null);
      setBusinessName('');
      return;
    }
    try {
      setLoading(true);
      const response = await cartAPI.getCart(customerId);
      const payload = response?.data?.data || response?.data || response || {};
      const apiItems = payload?.items || [];
      const deals = payload?.deals || [];
      const cart = payload?.cart || null;
      const normalized = (apiItems.length ? apiItems : deals)
        .map((item) => normalizeDeal(item, item?.quantity))
        .filter(Boolean);
      const cartBusinessId = cart?.business_id?._id || cart?.business_id || null;
      setItems(normalized);
      setBusinessId(cartBusinessId || (normalized[0]?.business_id ?? null));
      setBusinessName(normalized[0]?.business_name || '');
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const customerId = user?._id || user?.id;
    loadCart(customerId);
  }, [user?._id, user?.id, loadCart]);

  const clearCart = async () => {
    const customerId = user?._id || user?.id;
    if (!customerId) return;
    try {
      setItems([]);
      setBusinessId(null);
      setBusinessName('');
      await cartAPI.clearCart(customerId);
    } catch (error) {
      showToast.error('Error', error?.message || 'Unable to clear cart.');
      loadCart(customerId);
    }
  };

  const removeItem = async (dealId) => {
    const customerId = user?._id || user?.id;
    if (!customerId) return;
    try {
      await cartAPI.removeFromCart(customerId, dealId);
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== dealId);
        if (next.length === 0) {
          setBusinessId(null);
          setBusinessName('');
        }
        return next;
      });
    } catch (error) {
      showToast.error('Error', error?.message || 'Unable to remove this deal.');
    }
  };

  const updateItemQuantity = async (dealId, quantity) => {
    const customerId = user?._id || user?.id;
    if (!customerId) return { ok: false, reason: 'not_logged_in' };
    const nextQty = Math.floor(Number(quantity));
    if (!Number.isFinite(nextQty)) {
      showToast.error('Error', 'Invalid quantity.');
      return { ok: false };
    }

    try {
      await cartAPI.updateQuantity(customerId, dealId, nextQty);
      setItems((prev) => {
        if (nextQty <= 0) {
          const filtered = prev.filter((item) => item.id !== dealId);
          if (filtered.length === 0) {
            setBusinessId(null);
            setBusinessName('');
          }
          return filtered;
        }
        return prev.map((item) =>
          item.id === dealId ? { ...item, quantity: nextQty } : item
        );
      });
      return { ok: true };
    } catch (error) {
      const message = error?.message || error?.response?.data?.message;
      if (message) showToast.error('Error', message);
      return { ok: false };
    }
  };

  const addItem = async (deal, options = {}) => {
    const { skipBusinessCheck = false } = options;
    const normalized = normalizeDeal(deal);
    if (!normalized || !normalized.id) {
      showToast.error('Error', 'Unable to add this deal right now.');
      return { ok: false };
    }

    const customerId = user?._id || user?.id;
    if (!customerId) {
      return { ok: false, reason: 'not_logged_in' };
    }

    if (!skipBusinessCheck) {
      const currentBusinessId =
        businessId?._id ||
        businessId ||
        (items.length > 0 ? items[0]?.business_id : null);
      const incomingBusinessId =
        normalized.business_id ||
        deal?.business_id?._id ||
        deal?.business_id ||
        deal?.business?._id ||
        deal?.businessId;
      if (
        items.length > 0 &&
        currentBusinessId &&
        incomingBusinessId &&
        currentBusinessId.toString() !== incomingBusinessId.toString()
      ) {
        return { ok: false, reason: 'different_restaurant' };
      }
    }

    try {
      await cartAPI.addToCart(customerId, normalized.id);
      setItems((prev) => {
        const existing = prev.find((item) => item.id === normalized.id);
        if (existing) {
          return prev.map((item) =>
            item.id === normalized.id
              ? { ...item, quantity: Number(item.quantity || 1) + 1 }
              : item
          );
        }
        return [...prev, { ...normalized, quantity: Number(normalized.quantity || 1) }];
      });
      if (!businessId && normalized.business_id) {
        setBusinessId(normalized.business_id);
        setBusinessName(normalized.business_name || '');
      }
      return { ok: true };
    } catch (error) {
      const message = error?.message || error?.response?.data?.message;
      if (message) showToast.error('Error', message);
      return { ok: false };
    }
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 1);
        acc.total += (item.deal_total || 0) * qty;
        acc.original += (item.original_total || 0) * qty;
        return acc;
      },
      { total: 0, original: 0 }
    );
  }, [items]);

  const value = {
    items,
    businessId,
    businessName,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    totals,
    loading,
    reload: useCallback(() => loadCart(user?._id || user?.id), [loadCart, user?._id, user?.id]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);

export default CartContext;
