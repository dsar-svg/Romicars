import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket } from '../services/socket';
import type { Cliente, Mensaje } from '../types';

const canalIcono: Record<string, string> = {
  whatsapp: '/icons.svg#whatsapp',
  instagram: '/icons.svg#instagram',
  facebook: '/icons.svg#facebook',
};

function Inbox() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    const socket = connectSocket();

    clientesApi.getAll().then(setClientes);

    socket.on('message:new', (mensaje: Mensaje) => {
      setMensajes(prev => [...prev, mensaje]);
    });

    return () => { socket.off('message:new'); };
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const id = Number(clienteId);
    clientesApi.getById(id).then(setSelectedCliente);
    mensajesApi.getByCliente(id).then(setMensajes);
  }, [clienteId]);

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !selectedCliente) return;
    const socket = connectSocket();
    socket.emit('message:send', {
      cliente_id: selectedCliente.id,
      contenido: nuevoMensaje,
      remitente: 'agente',
    });
    setNuevoMensaje('');
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filtro === 'urgentes') return c.urgencia === 'Alta';
    if (filtro === 'bot') return c.resumen_busqueda;
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
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <div style={{ width: 340, background: 'var(--blanco)', borderRight: '1px solid var(--gris-borde)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--gris-borde)' }}>
          <input placeholder="Buscar chats..." style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid var(--gris-borde)', overflowX: 'auto' }}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'urgentes', label: 'Urgentes' },
            { key: 'bot', label: 'Bot' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{
                padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                background: filtro === f.key ? 'var(--rojo-primario)' : 'var(--gris-fondo)',
                color: filtro === f.key ? '#fff' : 'var(--gris-texto)',
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {clientesFiltrados.map(cliente => (
            <div key={cliente.id}
              onClick={() => navigate(`/inbox/${cliente.id}`)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--gris-fondo)',
                cursor: 'pointer',
                background: selectedCliente?.id === cliente.id ? 'var(--azul-claro)' : 'transparent',
                borderLeft: selectedCliente?.id === cliente.id ? '3px solid var(--azul-primario)' : '3px solid transparent',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong style={{ fontSize: 14, color: 'var(--gris-oscuro)' }}>
                  {cliente.nombre || cliente.telefono}
                </strong>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <svg width={12} height={12}>
                    <use href={canalIcono[cliente.canal_origen] || '/icons.svg#chat'} />
                  </svg>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: getUrgenciaColor(cliente.urgencia),
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gris-texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cliente.ultimo_mensaje || 'Sin mensajes'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--blanco)' }}>
        {selectedCliente ? (
          <>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--gris-borde)',
              background: 'var(--gris-fondo)',
            }}>
              <h3 style={{ fontSize: 18, color: 'var(--azul-oscuro)' }}>
                {selectedCliente.nombre || selectedCliente.telefono}
              </h3>
              {selectedCliente.resumen_busqueda && (
                <div style={{
                  marginTop: 8, padding: 12, background: 'var(--azul-claro)',
                  borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--azul-primario)',
                }}>
                  <strong>Resumen de IA:</strong> {selectedCliente.resumen_busqueda}
                  {selectedCliente.urgencia && (
                    <span style={{ marginLeft: 12, color: getUrgenciaColor(selectedCliente.urgencia), fontWeight: 600 }}>
                      Urgencia: {selectedCliente.urgencia}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {mensajes.map(msg => (
                <div key={msg.id} style={{
                  marginBottom: 8, padding: '10px 14px',
                  background: msg.remitente === 'bot'
                    ? 'var(--gris-fondo)'
                    : msg.remitente === 'agente'
                      ? 'var(--rojo-claro)'
                      : 'var(--blanco)',
                  border: msg.remitente === 'bot' ? '1px dashed var(--gris-borde)' : '1px solid var(--gris-borde)',
                  borderRadius: '12px 12px 12px 0',
                  maxWidth: '75%',
                  marginLeft: msg.remitente === 'agente' ? 'auto' : 0,
                  fontSize: 14,
                  lineHeight: 1.4,
                }}>
                  {msg.contenido}
                  <div style={{ fontSize: 11, color: 'var(--gris-texto)', marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--gris-borde)',
              display: 'flex',
              gap: 8,
              background: 'var(--gris-fondo)',
            }}>
              <input value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
                placeholder="Escribe un mensaje..."
                style={{ flex: 1 }} />
              <button onClick={enviarMensaje} className="btn-primary" style={{ padding: '10px 24px' }}>
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gris-texto)' }}>
            <img src="/logotipo.png" alt="" style={{ width: 80, opacity: 0.3, marginBottom: 16 }} />
            <p>Selecciona un chat para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;
