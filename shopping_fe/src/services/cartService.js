import api, { unwrapData } from './api';

export const cartService = {
  getCart() {
    return api.get('/cart').then(unwrapData);
  },

  addItemToCart(data) {
    return api.post('/cart/add', data).then(unwrapData);
  },

  updateCartItem(data) {
    return api.put('/cart/update', data).then(unwrapData);
  },

  removeItemFromCart(productId) {
    return api.delete(`/cart/remove/${productId}`).then(unwrapData);
  },

  clearCart() {
    return api.delete('/cart/clear').then(unwrapData);
  },
};
