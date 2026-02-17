import api from './client';

export const cartAPI = {
  getCart: async (customerId) => {
    const queryParams = new URLSearchParams();
    if (customerId) queryParams.append('customer_id', customerId);
    const query = queryParams.toString();
    return api.get(`/jomfood-deals/cart${query ? `?${query}` : ''}`);
  },
  addToCart: async (customerId, dealId) => {
    return api.post('/jomfood-deals/cart/add', { customer_id: customerId, deal_id: dealId });
  },
  removeFromCart: async (customerId, dealId) => {
    return api.post('/jomfood-deals/cart/remove', { customer_id: customerId, deal_id: dealId });
  },
  updateQuantity: async (customerId, dealId, quantity) => {
    return api.post('/jomfood-deals/cart/update-quantity', {
      customer_id: customerId,
      deal_id: dealId,
      quantity,
    });
  },
  clearCart: async (customerId) => {
    return api.post('/jomfood-deals/cart/clear', { customer_id: customerId });
  },
  checkoutCart: async (customerId, preferredServiceType, preferredDatetime) => {
    return api.post('/jomfood-deals/cart/checkout', {
      customer_id: customerId,
      preferred_service_type: preferredServiceType,
      preferred_datetime: preferredDatetime,
    });
  },
  getCartPaymentStatus: async (paymentId) => {
    const queryParams = new URLSearchParams();
    if (paymentId) queryParams.append('payment_id', paymentId);
    const query = queryParams.toString();
    return api.get(`/jomfood-deals/cart/payment-status${query ? `?${query}` : ''}`);
  },
};

export default cartAPI;
