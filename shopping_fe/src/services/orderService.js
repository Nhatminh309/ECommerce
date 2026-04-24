import api, { unwrapData } from './api';

export const orderService = {
  createOrder(shippingInfo) {
    return api.post('/orders', shippingInfo).then(r => r.data);
  },

  getOrder(id) {
    return api.get(`/orders/${id}`).then(unwrapData);
  },

  getMyOrders(params = {}) {
    return api.get('/orders/my', { params }).then(unwrapData);
  },

  getAllOrders(params = {}) {
    return api.get('/orders', { params }).then(unwrapData);
  },

  updateOrderStatus(id, status) {
    return api.put(`/orders/${id}/status`, { status }).then(unwrapData);
  },
};
