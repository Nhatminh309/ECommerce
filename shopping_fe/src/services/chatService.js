import api from './api';

export const chatService = {
  sendMessage(content) {
    return api.post('/api/chat/message', { content }).then(r => r.data);
  },
  getMyConversation() {
    return api.get('/api/chat/my').then(r => r.data);
  },
  // Admin
  getAllConversations() {
    return api.get('/api/chat/conversations').then(r => r.data);
  },
  getConversation(id) {
    return api.get(`/api/chat/conversations/${id}`).then(r => r.data);
  },
  adminReply(id, content) {
    return api.post(`/api/chat/conversations/${id}/reply`, { content }).then(r => r.data);
  },
  closeConversation(id) {
    return api.post(`/api/chat/conversations/${id}/close`).then(r => r.data);
  },
};
