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
                        <use href={canalIcono[cliente.canal_origen] || '/icons.svg#chat'} />
                      </svg>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: getUrgenciaColor(cliente.urgencia),
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gris-texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 44 }}>
                    {cliente.ultimo_mensaje || 'Sin mensajes'}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--blanco)' }}>
        {selectedCliente ? (
          <>
            <div className="fade-in" style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--gris-borde)',
              background: 'var(--gris-fondo)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--azul-primario), var(--azul-oscuro))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(selectedCliente.nombre || selectedCliente.telefono).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, color: 'var(--azul-oscuro)', fontWeight: 600 }}>
                      {selectedCliente.nombre || selectedCliente.telefono}
                    </h3>
                    <span style={{ fontSize: 13, color: 'var(--gris-texto)' }}>
                      {selectedCliente.canal_origen}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanel(!showPanel)}
                  style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 12,
                    background: showPanel ? 'var(--azul-primario)' : 'var(--gris-fondo)',
                    color: showPanel ? '#fff' : 'var(--gris-texto)',
                    border: '1px solid var(--gris-borde)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <User size={14} />
                  Ficha
                </button>
              </div>
              {selectedCliente.resumen_busqueda && (
                <div className="fade-in" style={{
                  marginTop: 12, padding: '12px 16px', background: 'var(--azul-claro)',
                  borderRadius: 'var(--radius)', fontSize: 13,
                  borderLeft: '3px solid var(--azul-primario)',
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  <AlertTriangle size={16} style={{ color: 'var(--azul-primario)', flexShrink: 0 }} />
                  <strong>Resumen IA:</strong> {selectedCliente.resumen_busqueda}
                  {selectedCliente.urgencia && (
                    <span style={{
                      marginLeft: 'auto', padding: '2px 10px', borderRadius: 12,
                      color: '#fff', fontSize: 11, fontWeight: 600,
                      background: getUrgenciaColor(selectedCliente.urgencia),
                    }}>
                      {selectedCliente.urgencia}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{
              flex: 1, overflowY: 'auto', padding: 16,
              position: 'relative',
              backgroundImage: 'url(/logotipo.png)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '260px auto',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.75)',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
              {mensajes.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: 'var(--gris-texto)', marginTop: 60, position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300,
                }}>
                  <img src="/logotipo.png" alt="" style={{
                    position: 'absolute', width: 200, opacity: 0.06, top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', pointerEvents: 'none',
                  }} />
                  <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: 12, position: 'relative' }} />
                  <p style={{ position: 'relative' }}>No hay mensajes en esta conversación</p>
                </div>
              ) : (
                mensajes.map(msg => (
                  <div key={msg.id} className="fade-in" style={{
                    marginBottom: 8, padding: '10px 14px',
                    background: msg.remitente === 'bot'
                      ? 'var(--gris-fondo)'
                      : msg.remitente === 'agente'
                        ? 'var(--rojo-claro)'
                        : 'var(--blanco)',
                    border: msg.remitente === 'bot' ? '1px dashed var(--gris-borde)' : '1px solid var(--gris-borde)',
                    borderRadius: msg.remitente === 'agente' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    maxWidth: '75%',
                    marginLeft: msg.remitente === 'agente' ? 'auto' : 0,
                    fontSize: 14,
                    lineHeight: 1.4,
                    boxShadow: msg.remitente === 'agente' ? '0 1px 4px rgba(211,47,47,0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    {msg.contenido}
                    <div style={{ fontSize: 11, color: 'var(--gris-texto)', marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--gris-borde)',
              display: 'flex',
              gap: 8,
              background: 'var(--gris-fondo)',
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
                  placeholder="Escribe un mensaje..."
                  style={{ width: '100%', paddingRight: 40 }} />
              </div>
              <button onClick={enviarMensaje} className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={16} />
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gris-texto)' }}>
            <img src="/logotipo.png" alt="" style={{ width: 220, opacity: 0.12, marginBottom: 24 }} />
            <p style={{ fontSize: 16, fontWeight: 500 }}>Selecciona un chat para empezar</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Los mensajes nuevos aparecerán aquí</p>
          </div>
        )}
      </div>
      {showPanel && selectedCliente && (
        <ClientPanel cliente={selectedCliente} onClose={() => setShowPanel(false)} />
      )}
    </div>
    </div>
  );
}

export default Inbox;
