import api from './api';

export const chatWithAI = (question, userId = null) =>
  api.post('/api/ai/chat', { question, user_id: userId }).then(r => r.data);

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/ai/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const listDocuments = () =>
  api.get('/api/ai/documents').then(r => r.data);

export const deleteDocument = (docId) =>
  api.delete(`/api/ai/documents/${docId}`).then(r => r.data);

export const askDocument = (question, docId = null) =>
  api.post('/api/ai/documents/ask', { question, doc_id: docId }).then(r => r.data);

export const generateReport = (query) =>
  api.post('/api/ai/report', { query }).then(r => r.data);