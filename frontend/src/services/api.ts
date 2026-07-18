import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const clientesApi = {
  getAll: () => api.get('/clientes').then(r => r.data),
  getById: (id: number) => api.get(`/clientes/${id}`).then(r => r.data),
  update: (id: number, data: any) => api.put(`/clientes/${id}`, data).then(r => r.data),
};

export const mensajesApi = {
  getByCliente: (clienteId: number) => api.get(`/mensajes/${clienteId}`).then(r => r.data),
  marcarLeido: (id: number) => api.put(`/mensajes/${id}/leer`).then(r => r.data),
  enviar: (data: { cliente_id: number; contenido: string; remitente: string; tipo?: string }) =>
    api.post('/mensajes/enviar', data).then(r => r.data),
};

export default api;
