import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, MessageSquare, User, Bot, CheckCheck } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { toast } from '../components/Toast';
import ClientPanel from '../components/ClientPanel';
import { useNotifications } from '../hooks/useNotifications';
import type { Cliente, Mensaje } from '../types';

const canalIcono: Record<string, string> = {
  whatsapp: '/icons.svg#whatsapp',
  instagram: '/icons.svg#instagram',
  facebook: '/icons.svg#facebook',
};

const canalLabel: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

function SkeletonChats() {
  return (
    <div style={{ padding: 16 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="fade-in" style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', animationDelay: `${i * 60}ms` }}>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '85%', height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Inbox() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const prevClienteId = useRef<string | undefined>(undefined);
  const currentClienteId = useRef<number | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [canalFiltro, setCanalFiltro] = useState('todos');
  const [filtroIA, setFiltroIA] = useState(false);
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { notify, clearNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    clientesApi.getAll().then(data => {
      setClientes(data);
      setLoading(false);
    });

    const refrescarClienteEnLista = (clienteId: number) => {
      clientesApi.getById(clienteId).then(actualizado => {
        setClientes(cs => {
          const idx = cs.findIndex(c => c.id === actualizado.id);
          if (idx >= 0) {
            const copy = [...cs];
            copy[idx] = actualizado;
            return copy;
          }
          return [actualizado, ...cs];
        });
      }).catch(() => {
        clientesApi.getAll().then(setClientes);
      });
    };

    socket.on('message:new', (mensaje: Mensaje) => {
      const isCurrent = currentClienteId.current === mensaje.cliente_id;
      if (isCurrent) {
        setMensajes(prev => [...prev, mensaje]);
      }
      notify(mensaje, isCurrent);
      refrescarClienteEnLista(mensaje.cliente_id);
    });

    socket.on('chat:updated', (data: { cliente_id: number }) => {
      refrescarClienteEnLista(data.cliente_id);
    });

    return () => {
      socket.off('message:new');
      socket.off('chat:updated');
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (prevClienteId.current === clienteId) return;
    if (prevClienteId.current) {
      socket.emit('leave:chat', Number(prevClienteId.current));
    }
    prevClienteId.current = clienteId;
    if (!clienteId) { setSelectedCliente(null); return; }
    const id = Number(clienteId);
    socket.emit('join:chat', id);
    currentClienteId.current = id;
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

  useEffect(() => {
    clearNotifications();
    const handleVisibility = () => { if (!document.hidden) clearNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clienteId]);

  useEffect(() => {
    if (clienteId && clientes.length > 0 && clientesFiltrados.length > 0) {
      const exists = clientesFiltrados.some(c => c.id === Number(clienteId));
      if (!exists) navigate('/inbox', { replace: true });
    }
  }, [canalFiltro, urgenciaFiltro, filtroIA, searchTerm]);

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
    if (canalFiltro !== 'todos' && c.canal_origen !== canalFiltro) return false;
    if (urgenciaFiltro === 'urgentes' && c.urgencia !== 'Alta') return false;
    if (urgenciaFiltro === 'interesado' && c.estado_venta !== 'Interesado') return false;
    if (urgenciaFiltro === 'neutro' && c.estado_venta !== 'Lead') return false;
    if (filtroIA && !c.resumen_busqueda) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const name = (c.nombre || '').toLowerCase();
      const phone = (c.telefono || '').toLowerCase();
      if (!name.includes(s) && !phone.includes(s)) return false;
    }
    return true;
  });

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta': return '#DC2626';
      case 'Media': return '#D97706';
      case 'Baja': return '#2563EB';
      default: return '#9CA3AF';
    }
  };

  const getUrgenciaBg = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta': return '#FEF2F2';
      case 'Media': return '#FFFBEB';
      case 'Baja': return '#EFF6FF';
      default: return '#F9FAFB';
    }
  };

  const filtrosCanales = [
    { key: 'todos', label: 'Todos', color: '#6B7280' },
    { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{
        width: 380, background: 'var(--blanco)', borderRight: '1px solid var(--gris-borde)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--gris-borde)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gris-oscuro)', marginBottom: 12, letterSpacing: '-0.03em' }}>
            Bandeja
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gris-texto)', marginLeft: 10 }}>
              {clientesFiltrados.length} chats
            </span>
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gris-texto)', pointerEvents: 'none' }} />
            <input
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12 }}
            />
          </div>
        </div>

        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--gris-borde)',
          display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-filtros)',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Canal
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {filtrosCanales.map(f => (
                <button key={f.key} onClick={() => setCanalFiltro(f.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: canalFiltro === f.key ? f.color : 'var(--blanco)',
                    color: canalFiltro === f.key ? '#fff' : 'var(--gris-texto)',
                    border: canalFiltro === f.key ? 'none' : '1.5px solid var(--gris-borde)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {canalFiltro === f.key && f.key !== 'todos' && (
                    <span style={{ marginRight: 4 }}>✓</span>
                  )}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Urgencia
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { key: 'todos', label: 'Todos', color: '#6B7280' },
                { key: 'urgentes', label: '🔴 Urgentes', color: '#DC2626' },
                { key: 'interesado', label: '🟡 Interesado', color: '#D97706' },
                { key: 'neutro', label: '⚪ Neutro', color: '#6B7280' },
              ].map(f => (
                <button key={f.key} onClick={() => setUrgenciaFiltro(f.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: urgenciaFiltro === f.key ? f.color : 'var(--blanco)',
                    color: urgenciaFiltro === f.key ? '#fff' : 'var(--gris-texto)',
                    border: urgenciaFiltro === f.key ? 'none' : '1.5px solid var(--gris-borde)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  {urgenciaFiltro === f.key && f.key !== 'todos' ? '✓ ' : ''}{f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gris-texto)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              IA
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button onClick={() => setFiltroIA(!filtroIA)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: filtroIA ? '#7C3AED' : 'var(--blanco)',
                  color: filtroIA ? '#fff' : 'var(--gris-texto)',
                  border: filtroIA ? 'none' : '1.5px solid var(--gris-borde)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {filtroIA ? '✓ ' : ''}🤖 Con IA
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? <SkeletonChats /> : (
            clientesFiltrados.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--gris-texto)' }}>
                <MessageSquare size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No hay chats</p>
                <p style={{ fontSize: 13, marginTop: 4, color: 'var(--gris-texto)' }}>
                  {searchTerm ? 'Intenta con otro término de búsqueda' : canalFiltro !== 'todos' ? 'Cambia el filtro para ver más' : 'Los mensajes nuevos aparecerán aquí'}
                </p>
              </div>
            ) : (
              clientesFiltrados.map((cliente, i) => (
                <div key={cliente.id}
                  onClick={() => navigate(`/inbox/${cliente.id}`)}
                  className="fade-in-up"
                  style={{
                    padding: '16px 16px',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    background: selectedCliente?.id === cliente.id ? 'var(--azul-claro)' : 'transparent',
                    borderLeft: selectedCliente?.id === cliente.id ? '3px solid var(--rojo-primario)' : '3px solid transparent',
                    transition: 'all 0.2s',
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={e => {
                    if (selectedCliente?.id !== cliente.id) e.currentTarget.style.background = 'var(--gris-fondo)';
                  }}
                  onMouseLeave={e => {
                    if (selectedCliente?.id !== cliente.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: cliente.urgencia === 'Alta'
                          ? 'linear-gradient(135deg, #DC2626, #8B0508)'
                          : 'linear-gradient(135deg, var(--azul-primario), var(--azul-oscuro))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
                        boxShadow: cliente.urgencia === 'Alta' ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 6px rgba(1,41,128,0.2)',
                      }}>
                        {(cliente.nombre || cliente.telefono || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: 14, color: 'var(--gris-oscuro)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cliente.nombre || cliente.telefono || 'Sin nombre'}
                        </strong>
                        <span style={{ fontSize: 12, color: 'var(--gris-texto)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width={12} height={12} style={{ flexShrink: 0 }}>
                            <use href={canalIcono[cliente.canal_origen] || '/icons.svg#chat'} />
                          </svg>
                          {canalLabel[cliente.canal_origen] || cliente.canal_origen}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: getUrgenciaColor(cliente.urgencia),
                        boxShadow: `0 0 0 3px ${getUrgenciaBg(cliente.urgencia)}`,
                      }} />
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: getUrgenciaColor(cliente.urgencia),
                        background: getUrgenciaBg(cliente.urgencia),
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {cliente.urgencia}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--gris-texto)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    paddingLeft: 50, lineHeight: 1.4,
                  }}>
                    {cliente.ultimo_mensaje || 'Sin mensajes'}
                  </div>
                  {cliente.resumen_busqueda && (
                    <div style={{
                      marginTop: 8, marginLeft: 50, padding: '4px 10px',
                      background: 'var(--azul-claro)', borderRadius: 6, fontSize: 12,
                      color: 'var(--azul-primario)', display: 'flex', alignItems: 'center', gap: 6,
                      borderLeft: '2px solid var(--azul-primario)',
                    }}>
                      <Bot size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cliente.resumen_busqueda}
                      </span>
                    </div>
                  )}
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
                background: 'var(--bg-filtros)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--azul-primario), #001A52)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(1,41,128,0.2)',
                    }}>
                      {(selectedCliente.nombre || selectedCliente.telefono || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gris-oscuro)', letterSpacing: '-0.02em' }}>
                        {selectedCliente.nombre || selectedCliente.telefono || 'Sin nombre'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: '#fff', padding: '2px 10px',
                          borderRadius: 12, background: getUrgenciaColor(selectedCliente.urgencia),
                        }}>
                          {selectedCliente.urgencia}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--gris-texto)' }}>
                          {canalLabel[selectedCliente.canal_origen] || selectedCliente.canal_origen}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setShowPanel(!showPanel)}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: showPanel ? 'var(--rojo-primario)' : 'var(--blanco)',
                        color: showPanel ? '#fff' : 'var(--gris-oscuro)',
                        border: '1.5px solid var(--gris-borde)',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <User size={14} />
                      {showPanel ? 'Cerrar ficha' : 'Ficha'}
                    </button>
                  </div>
                </div>
                {selectedCliente.resumen_busqueda && (
                  <div className="fade-in" style={{
                    margin: '14px 24px 0', padding: '16px 18px',
                    background: 'linear-gradient(135deg, var(--azul-claro), #E6EEF9)',
                    borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                    border: '1px solid var(--azul-primario)',
                    borderLeft: '4px solid var(--azul-primario)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    boxShadow: '0 2px 8px rgba(1,41,128,0.1)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--azul-primario), #001A52)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(1,41,128,0.25)',
                    }}>
                      <Bot size={16} style={{ color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul-primario)', marginBottom: 4, letterSpacing: '0.3px' }}>
                        RESUMEN DE IA
                      </div>
                      {selectedCliente.resumen_busqueda}
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 24px',
                background: 'var(--bg-chat)',
              }}>
                {mensajes.length === 0 ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: 'var(--gris-texto)',
                  }}>
                    <MessageSquare size={48} style={{ opacity: 0.12, marginBottom: 16 }} />
                    <p style={{ fontSize: 15, fontWeight: 600 }}>Sin mensajes aún</p>
                    <p style={{ fontSize: 13, marginTop: 4, color: 'var(--gris-texto)' }}>
                      Envía el primer mensaje para iniciar la conversación
                    </p>
                  </div>
                ) : (
                  mensajes.map((msg, i) => {
                    const isAgent = msg.remitente === 'agente';
                    const isBot = msg.remitente === 'bot';
                    const isRight = isAgent || isBot;
                    return (
                      <div key={msg.id} className="fade-in-up" style={{
                        marginBottom: 12,
                        display: 'flex',
                        flexDirection: isRight ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 8,
                        animationDelay: `${i * 30}ms`,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff',
                          background: isAgent
                            ? 'linear-gradient(135deg, #BD060A, #8B0508)'
                            : isBot
                              ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                              : 'linear-gradient(135deg, var(--azul-primario), #001A52)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          overflow: 'hidden',
                        }}>
                          {isAgent ? (
                            <img src="/loguito.png" alt="" style={{ width: 20, height: 20, filter: 'brightness(10)' }} />
                          ) : isBot ? (
                            <Bot size={16} />
                          ) : (
                            (selectedCliente?.nombre || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{
                          padding: '10px 14px',
                          background: isAgent
                            ? 'linear-gradient(135deg, #BD060A, #9E0508)'
                            : isBot
                              ? 'var(--msg-bot)'
                              : 'var(--msg-cliente)',
                          border: isAgent
                            ? 'none'
                            : isBot
                              ? '1.5px dashed #6B7280'
                              : '1.5px solid var(--gris-borde)',
                          borderRadius: isAgent || isBot
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                          maxWidth: '65%',
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: isAgent ? '#fff' : 'var(--gris-oscuro)',
                          boxShadow: isAgent
                            ? '0 2px 12px rgba(189,6,10,0.25)'
                            : '0 1px 4px rgba(0,0,0,0.04)',
                        }}>
                          <div style={{
                            fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>
                            {isAgent ? 'Tú' : isBot ? 'Bot IA' : selectedCliente?.nombre || 'Cliente'}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.contenido}
                          </div>
                          <div style={{
                            fontSize: 11, marginTop: 6, opacity: 0.6, textAlign: 'right',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                          }}>
                            {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            {isAgent && <CheckCheck size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--gris-borde)',
                display: 'flex',
                gap: 10,
                background: 'var(--blanco)',
              }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    value={nuevoMensaje}
                    onChange={e => setNuevoMensaje(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensaje())}
                    placeholder="Escribe un mensaje..."
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14 }}
                  />
                </div>
                <button
                  onClick={enviarMensaje}
                  style={{
                    padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    background: nuevoMensaje.trim() ? 'linear-gradient(135deg, #BD060A, #9E0508)' : 'var(--gris-borde)',
                    color: nuevoMensaje.trim() ? '#fff' : 'var(--gris-texto)',
                    border: 'none', cursor: nuevoMensaje.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: nuevoMensaje.trim() ? '0 2px 8px rgba(189,6,10,0.25)' : 'none',
                  }}
                >
                  <Send size={16} />
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--gris-texto)',
              background: 'var(--bg-chat)', position: 'relative', overflow: 'hidden',
            }}>
              <img
                src="/logotipo.png"
                alt=""
                style={{
                  position: 'absolute', opacity: 0.1, width: 360, height: 'auto',
                  pointerEvents: 'none', userSelect: 'none',
                }}
              />
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'var(--gris-fondo)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24, border: '2px dashed var(--gris-borde)',
              }}>
                <MessageSquare size={48} style={{ color: 'var(--gris-borde)' }} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--gris-oscuro)' }}>Selecciona un chat</p>
              <p style={{ fontSize: 14, marginTop: 6, color: 'var(--gris-texto)' }}>Elige una conversación de la bandeja para comenzar</p>
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
