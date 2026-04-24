import api, { unwrapData } from './api';

export const productService = {
  getAllProducts(params = {}) {
    return api.get('/products', { params }).then(unwrapData);
  },

  getProduct(id) {
    return api.get(`/products/${id}`).then(unwrapData);
  },

  createProduct(data) {
    return api.post('/products', data).then(unwrapData);
  },

  updateProduct(id, data) {
    return api.put(`/products/${id}`, data).then(unwrapData);
  },

  deleteProduct(id) {
    return api.delete(`/products/${id}`).then(unwrapData);
  },

  uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => response.data?.url);
  },

  addImagesToProduct(id, imageUrls) {
    return api.post(`/products/${id}/images`, { imageUrls }).then(unwrapData);
  },

  deleteProductImage(imageId) {
    return api.delete(`/products/images/${imageId}`).then(unwrapData);
  },
};
