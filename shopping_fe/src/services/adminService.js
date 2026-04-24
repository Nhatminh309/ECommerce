import api from './api';

export const adminService = {
  getDashboard() {
    return api.get('/api/admin/dashboard').then(r => r.data);
  },
  getUsers(params = {}) {
    return api.get('/api/admin/users', { params }).then(r => r.data);
  },
  toggleUserActive(id) {
    return api.put(`/api/admin/users/${id}/toggle-active`).then(r => r.data);
  },
};
