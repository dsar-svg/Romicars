import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Inbox from './pages/Inbox';
import Dashboard from './pages/Dashboard';
import Campañas from './pages/Campañas';
import AdminAgentes from './pages/AdminAgentes';
import AdminConfig from './pages/AdminConfig';
import Login from './pages/Login';
import Layout from './components/Layout';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { agente, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>Cargando...</div>;
  if (!agente) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { agente, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>Cargando...</div>;
  if (!agente) return <Navigate to="/login" replace />;
  if (agente.rol_nombre !== 'superadmin') return <Navigate to="/inbox" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route path="/" element={<Navigate to="/inbox" replace />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/inbox/:clienteId" element={<Inbox />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campanas" element={<Campañas />} />
        <Route path="/admin/agentes" element={
          <AdminRoute><AdminAgentes /></AdminRoute>
        } />
        <Route path="/admin/config" element={
          <AdminRoute><AdminConfig /></AdminRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
