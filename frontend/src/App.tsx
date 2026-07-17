import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inbox from './pages/Inbox';
import Dashboard from './pages/Dashboard';
import Campañas from './pages/Campañas';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:clienteId" element={<Inbox />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campanas" element={<Campañas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
