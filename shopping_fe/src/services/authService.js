import api, { unwrapData } from './api';

export const authService = {
  login(data) {
    return api.post('/auth/login', data).then(unwrapData);
  },

  register(data) {
    return api.post('/auth/register', data).then(unwrapData);
  },

  getCurrentUser() {
    return api.get('/auth/me').then(unwrapData);
  },

  getUserById(userId) {
    return api.get(`/auth/user/${userId}`).then(unwrapData);
  },
};
