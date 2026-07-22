import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, MessageSquare, Bot, CheckCheck, Bell, Paperclip, Smile, Phone, Video, PanelRightOpen, PanelRightClose } from 'lucide-react';
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

const canalColor: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E4405F',
  facebook: '#1877F2',
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
  const urgenciaFiltro = 'todos';
  const [searchTerm, setSearchTerm] = useState('');
  const { notify, clearNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f6f9fc' }}>
      {/* TopAppBar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e0e8f0', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#002045', fontFamily: "'Hanken Grotesk', sans-serif" }}>
            Inbox Multicanal
          </h1>
          <div style={{ display: 'flex', gap: 4, height: 60, alignItems: 'stretch' }}>
            {[
              { key: 'direct', label: 'Direct' },
              { key: 'groups', label: 'Groups' },
              { key: 'archived', label: 'Archived' },
            ].map(t => (
              <button key={t.key} style={{
                padding: '0 16px', fontSize: 13, fontWeight: t.key === 'direct' ? 700 : 500,
                color: t.key === 'direct' ? '#002045' : '#8896ab',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: t.key === 'direct' ? '2px solid #b51822' : '2px solid transparent',
                fontFamily: "'Inter', sans-serif",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#002045', background: '#f0f4fa', border: '1px solid #e0e8f0', borderRadius: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Export CSV
          </button>
          <button style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#b51822', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
            Create Campaign
          </button>
          <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={18} style={{ color: '#002045' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#b51822' }} />
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#002045', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            A
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — lista conversaciones */}
        <div style={{
          width: 350, background: '#fff', borderRight: '1px solid #e0e8f0',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Búsqueda + filtros rápidos */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e0e8f0' }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8896ab', pointerEvents: 'none' }} />
              <input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, fontSize: 13,
                  border: '1px solid #e0e8f0', background: '#f6f9fc', outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'todos', label: 'All' },
                { key: 'whatsapp', label: 'WA', color: '#25D366' },
                { key: 'instagram', label: 'IG', color: '#E4405F' },
                { key: 'facebook', label: 'FB', color: '#1877F2' },
              ].map(f => (
                <button key={f.key} onClick={() => setCanalFiltro(f.key)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: canalFiltro === f.key ? '#002045' : 'transparent',
                    color: canalFiltro === f.key ? '#fff' : '#8896ab',
                    border: canalFiltro === f.key ? 'none' : '1px solid #e0e8f0',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}>
                  {f.label}
                </button>
              ))}
              <button onClick={() => setFiltroIA(!filtroIA)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: filtroIA ? '#002045' : 'transparent',
                  color: filtroIA ? '#fff' : '#8896ab',
                  border: filtroIA ? 'none' : '1px solid #e0e8f0',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                }}>
                IA
              </button>
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <SkeletonChats /> : (
              clientesFiltrados.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#8896ab' }}>
                  <MessageSquare size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>No hay chats</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>
                    {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los mensajes nuevos aparecerán aquí'}
                  </p>
                </div>
              ) : (
                clientesFiltrados.map((cliente, i) => {
                  const initial = (cliente.nombre || cliente.telefono || '?').charAt(0).toUpperCase();
                  const canal = cliente.canal_origen;
                  const isSelected = selectedCliente?.id === cliente.id;
                  return (
                    <div key={cliente.id}
                      onClick={() => navigate(`/inbox/${cliente.id}`)}
                      className="fade-in-up"
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f0f2f5',
                        cursor: 'pointer',
                        background: isSelected ? '#f0f4fa' : 'transparent',
                        transition: 'all 0.15s',
                        animationDelay: `${i * 30}ms`,
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f6f9fc'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Avatar con badge de canal */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            background: '#002045',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 700, color: '#fff',
                          }}>
                            {initial}
                          </div>
                          {canalColor[canal] && (
                            <div style={{
                              position: 'absolute', bottom: -1, right: -1,
                              width: 16, height: 16, borderRadius: '50%',
                              background: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 0 0 1.5px #fff',
                            }}>
                              <svg width={10} height={10}>
                                <use href={canalIcono[canal] || '/icons.svg#chat'} />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <strong style={{ fontSize: 14, fontWeight: 600, color: '#002045', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cliente.nombre || cliente.telefono || 'Sin nombre'}
                            </strong>
                            <span style={{ fontSize: 11, color: '#8896ab', flexShrink: 0, marginLeft: 8 }}>
                              {new Date(cliente.ultima_actividad || Date.now()).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                            {canalLabel[canal] && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                color: '#fff', background: canalColor[canal],
                              }}>
                                {canalLabel[canal]}
                              </span>
                            )}
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: getUrgenciaColor(cliente.urgencia),
                            }} />
                          </div>
                          <div style={{ fontSize: 13, color: '#5a6a7c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                            {cliente.ultimo_mensaje || 'Sin mensajes'}
                          </div>
                          {cliente.resumen_busqueda && (
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#002045' }}>
                              <Bot size={11} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cliente.resumen_busqueda}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Centro — conversación */}
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f6f9fc' }}>
            {selectedCliente ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '12px 20px', borderBottom: '1px solid #e0e8f0',
                  background: '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: '#002045',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 700, color: '#fff',
                        }}>
                          {(selectedCliente.nombre || selectedCliente.telefono || '?').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#002045', fontFamily: "'Inter', sans-serif" }}>
                          {selectedCliente.nombre || selectedCliente.telefono || 'Sin nombre'}
                        </h3>
                        <span style={{ fontSize: 12, color: '#5a6a7c' }}>
                          {canalLabel[selectedCliente.canal_origen] || selectedCliente.canal_origen}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Phone size={14} style={{ color: '#002045' }} />
                      </button>
                      <button style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Video size={14} style={{ color: '#002045' }} />
                      </button>
                      <button style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Search size={14} style={{ color: '#002045' }} />
                      </button>
                      <button
                        onClick={() => setShowPanel(!showPanel)}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          border: showPanel ? '2px solid #002045' : '1px solid #e0e8f0',
                          background: showPanel ? '#eef3f9' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        title={showPanel ? 'Ocultar panel' : 'Mostrar panel'}
                      >
                        {showPanel
                          ? <PanelRightClose size={14} style={{ color: '#002045' }} />
                          : <PanelRightOpen size={14} style={{ color: '#002045' }} />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                  {mensajes.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8896ab' }}>
                      <MessageSquare size={48} style={{ opacity: 0.12, marginBottom: 16 }} />
                      <p style={{ fontSize: 15, fontWeight: 600 }}>Sin mensajes aún</p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>Envía el primer mensaje para iniciar la conversación</p>
                    </div>
                  ) : (
                    mensajes.map((msg, i) => {
                      const isAgent = msg.remitente === 'agente';
                      const isBot = msg.remitente === 'bot';
                      const isRight = isAgent || isBot;
                      return (
                        <div key={msg.id} className="fade-in-up" style={{
                          marginBottom: 8,
                          display: 'flex',
                          flexDirection: isRight ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                          animationDelay: `${i * 20}ms`,
                        }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            background: isRight ? '#002045' : '#e5eeff',
                            borderRadius: isRight
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: isRight ? '#fff' : '#002045',
                          }}>
                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {msg.contenido}
                            </div>
                            <div style={{
                              fontSize: 10, marginTop: 5,
                              color: isRight ? 'rgba(255,255,255,0.6)' : 'rgba(0,32,69,0.5)',
                              textAlign: 'right',
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
                            }}>
                              {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              {isAgent && <CheckCheck size={10} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #e0e8f0',
                  background: '#fff',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <button style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Paperclip size={14} style={{ color: '#8896ab' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <input
                      value={nuevoMensaje}
                      onChange={e => setNuevoMensaje(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), enviarMensaje())}
                      placeholder="Type a message..."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
                        border: '1px solid #e0e8f0', background: '#f6f9fc', outline: 'none',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                  <button style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Smile size={14} style={{ color: '#8896ab' }} />
                  </button>
                  <button
                    onClick={enviarMensaje}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: nuevoMensaje.trim() ? '#b51822' : '#e0e8f0',
                      border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: nuevoMensaje.trim() ? 'pointer' : 'not-allowed',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}
                  >
                    <Send size={14} style={{ color: nuevoMensaje.trim() ? '#fff' : '#8896ab' }} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: '#8896ab',
              }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e0e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <MessageSquare size={32} style={{ color: '#8896ab' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#002045' }}>Selecciona un chat</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Elige una conversación de la bandeja para comenzar</p>
              </div>
            )}
          </div>

          {/* Right Panel — toggleable */}
          {selectedCliente && showPanel && (
            <ClientPanel cliente={selectedCliente} onClose={() => setShowPanel(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Inbox;
