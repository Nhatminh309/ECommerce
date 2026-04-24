import api from './api';

export const paymentService = {
  createPayment: (body) =>
    api.post('/api/payment/create', body).then(r => r.data),
};
