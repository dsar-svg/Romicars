import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const clientesApi = {
  getAll: () => api.get('/clientes').then(r => r.data),
  getById: (id: number) => api.get(`/clientes/${id}`).then(r => r.data),
  update: (id: number, data: any) => api.put(`/clientes/${id}`, data).then(r => r.data),
};

export const mensajesApi = {
  getByCliente: (clienteId: number, limit?: number, offset?: number) =>
    api.get(`/mensajes/${clienteId}`, { params: { limit, offset } }).then(r => r.data),
  marcarLeido: (id: number) => api.put(`/mensajes/${id}/leer`).then(r => r.data),
  enviar: (data: { cliente_id: number; contenido: string; remitente: string; tipo?: string }) =>
    api.post('/mensajes/enviar', data).then(r => r.data),
};

export const profitApi = {
  getDashboard: () => api.get('/profit/dashboard').then(r => r.data),
  getProductosMasVendidos: (limit = 10) => api.get(`/profit/productos/mas-vendidos?limit=${limit}`).then(r => r.data),
  getProductosMenosVendidos: (limit = 10) => api.get(`/profit/productos/menos-vendidos?limit=${limit}`).then(r => r.data),
  getFacturacion: () => api.get('/profit/facturacion').then(r => r.data),
  getClientesMapa: () => api.get('/profit/clientes/mapa').then(r => r.data),
};

export default api;
