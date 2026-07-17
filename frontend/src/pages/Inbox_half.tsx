import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, Phone, MessageSquare, AlertTriangle, User, ChevronRight } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket } from '../services/socket';
import { toast } from '../components/Toast';
import ClientPanel from '../components/ClientPanel';
import type { Cliente, Mensaje } from '../types';

const canalIcono: Record<string, string> = {
  whatsapp: '/icons.svg#whatsapp',
  instagram: '/icons.svg#instagram',
  facebook: '/icons.svg#facebook',
};

function SkeletonChats() {
  return (
    <div style={{ padding: 16 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '80%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Inbox() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const socket = connectSocket();

    clientesApi.getAll().then(data => {
      setClientes(data);
      setLoading(false);
    });

    socket.on('message:new', (mensaje: Mensaje) => {
      setMensajes(prev => [...prev, mensaje]);
    });

    return () => { socket.off('message:new'); };
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const id = Number(clienteId);
    setLoading(true);
    Promise.all([
      clientesApi.getById(id),
      mensajesApi.getByCliente(id),
    ]).then(([cliente, msgs]) => {
      setSelectedCliente(cliente);
      setMensajes(msgs);
      setLoading(false);
    });
  }, [clienteId]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedCliente) return;
    try {
      const msg = await mensajesApi.enviar({
        cliente_id: selectedCliente.id,
        contenido: nuevoMensaje,
        remitente: 'agente',
      });
      setMensajes(prev => [...prev, msg]);
      setNuevoMensaje('');
      toast('success', 'Mensaje enviado');
    } catch {
      toast('error', 'Error al enviar mensaje');
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filtro === 'urgentes') return c.urgencia === 'Alta';
    if (filtro === 'bot') return c.resumen_busqueda;
    if (filtro === 'whatsapp') return c.canal_origen === 'whatsapp';
    if (filtro === 'instagram') return c.canal_origen === 'instagram';
    if (filtro === 'facebook') return c.canal_origen === 'facebook';
    return true;
  });

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta': return 'var(--rojo-primario)';
      case 'Media': return '#F9A825';
      case 'Baja': return 'var(--azul-primario)';
      default: return 'var(--gris-texto)';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{
        width: 360, background: 'var(--blanco)', borderRight: '1px solid var(--gris-borde)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--gris-borde)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gris-texto)' }} />
            <input placeholder="Buscar chats..." style={{ width: '100%', paddingLeft: 36 }} />
          </div>
        </div>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--gris-borde)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'todos', label: 'Todos' },
              { key: 'urgentes', label: 'Urgentes' },
              { key: 'bot', label: 'Bot' },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: filtro === f.key ? 'var(--rojo-primario)' : 'var(--gris-fondo)',
                  color: filtro === f.key ? '#fff' : 'var(--gris-texto)',
                  border: filtro === f.key ? 'none' : '1px solid var(--gris-borde)',
                }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'whatsapp', label: 'WhatsApp' },
              { key: 'instagram', label: 'Instagram' },
              { key: 'facebook', label: 'Facebook' },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltro(f.key)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: filtro === f.key ? 'var(--azul-primario)' : 'var(--gris-fondo)',
                  color: filtro === f.key ? '#fff' : 'var(--gris-texto)',
                  border: filtro === f.key ? 'none' : '1px solid var(--gris-borde)',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <SkeletonChats /> : (
            clientesFiltrados.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gris-texto)', fontSize: 14 }}>
                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No hay chats {filtro !== 'todos' && 'con este filtro'}</p>
              </div>
            ) : (
              clientesFiltrados.map(cliente => (
                <div key={cliente.id}
                  onClick={() => navigate(`/inbox/${cliente.id}`)}
                  className="slide-in"
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--gris-fondo)',
                    cursor: 'pointer',
                    background: selectedCliente?.id === cliente.id ? 'var(--azul-claro)' : 'transparent',
                    borderLeft: selectedCliente?.id === cliente.id ? '3px solid var(--azul-primario)' : '3px solid transparent',
                    transition: 'background 0.2s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `linear-gradient(135deg, var(--azul-primario), var(--azul-oscuro))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {(cliente.nombre || cliente.telefono).charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ fontSize: 14, color: 'var(--gris-oscuro)' }}>
                        {cliente.nombre || cliente.telefono}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <svg width={12} height={12}>
                        <use href={c
