import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, MessageSquare, Bot, CheckCheck, Paperclip, Smile, Phone, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { toast } from '../components/Toast';
import ClientPanel from '../components/ClientPanel';
import AudioPlayer from '../components/AudioPlayer';
import FileCard from '../components/FileCard';
import GalleryView from '../components/GalleryView';
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

const avatarColors = ['#1A365D', '#B51822', '#0F5C3A', '#6B2FA0', '#C97D0E', '#1B7A7A', '#A04040', '#2D6B4F'];
const getAvatarColor = (name: string) => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

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
  const idsRef = useRef<Set<number>>(new Set());
  const agregarMensaje = (msg: Mensaje) => {
    if (idsRef.current.has(msg.id)) return;
    idsRef.current = new Set(idsRef.current).add(msg.id);
    setMensajes(prev => [...prev, msg]);
  };
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [canalFiltro, setCanalFiltro] = useState('todos');
  const [filtroIA, setFiltroIA] = useState(false);
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { notify, clearNotifications } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadChats, setUnreadChats] = useState<Set<number>>(new Set());
  const [showPanel, setShowPanel] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const newMsgCountRef = useRef(0);
  const [searchMode, setSearchMode] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const fetchIdRef = useRef<number | null>(null);
  const cargarMasRef = useRef<() => Promise<void>>(async () => {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!window.__unreadChats) window.__unreadChats = new Set<number>();
    setUnreadChats(new Set(window.__unreadChats));
    const handler = () => setUnreadChats(new Set(window.__unreadChats!));
    window.addEventListener('unread-sync', handler);
    return () => window.removeEventListener('unread-sync', handler);
  }, []);

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
        agregarMensaje(mensaje);
        if (showScrollBtn) {
          newMsgCountRef.current += 1;
          setNewMsgCount(newMsgCountRef.current);
        }
      } else {
        window.__unreadChats?.add(mensaje.cliente_id);
        setUnreadChats(new Set(window.__unreadChats));
      }
      notify(mensaje, isCurrent);
      refrescarClienteEnLista(mensaje.cliente_id);
    });

    socket.on('chat:updated', (data: { cliente_id: number }) => {
      refrescarClienteEnLista(data.cliente_id);
    });

    socket.on('cliente:updated', (cliente: Cliente) => {
      setClientes(cs => {
        const idx = cs.findIndex(c => c.id === cliente.id);
        if (idx >= 0) {
          const copy = [...cs];
          copy[idx] = cliente;
          return copy;
        }
        return cs;
      });
      setSelectedCliente(prev => prev?.id === cliente.id ? cliente : prev);
    });

    return () => {
      socket.off('message:new');
      socket.off('chat:updated');
      socket.off('cliente:updated');
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
    fetchIdRef.current = id;
    socket.emit('join:chat', id);
    currentClienteId.current = id;
    window.__unreadChats?.delete(id);
    setUnreadChats(new Set(window.__unreadChats || []));
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setMensajes([]);
    setMessagesLoading(true);
    const cached = clientes.find(c => c.id === id);
    if (cached) setSelectedCliente(cached);

    const load = async (chatId: number) => {
      const msgs = await mensajesApi.getByCliente(chatId, 20) as Mensaje[];
      if (fetchIdRef.current !== chatId) return;
      idsRef.current = new Set(msgs.map(m => m.id));
      setMensajes(msgs);
      offsetRef.current = msgs.length;
      setMessagesLoading(false);
      if (msgs.length < 20) { hasMoreRef.current = false; return; }
      const mas = await mensajesApi.getByCliente(chatId, 50, 20) as Mensaje[];
      if (fetchIdRef.current !== chatId) return;
      const todos = [...mas, ...msgs] as Mensaje[];
      idsRef.current = new Set(todos.map(m => m.id));
      setMensajes(todos);
      hasMoreRef.current = mas.length >= 50;
      offsetRef.current = 20 + mas.length;
    };
    load(id);
  }, [clienteId]);

  useEffect(() => {
    clearNotifications();
    const handleVisibility = () => { if (!document.hidden) clearNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clienteId]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || loadingMoreRef.current) return;
    const cerca = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (cerca) el.scrollTop = el.scrollHeight;
  }, [mensajes]);

  const cargarMas = async () => {
    const chatId = fetchIdRef.current;
    if (chatId === null || loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    const prevHeight = messagesContainerRef.current?.scrollHeight || 0;
    try {
      const msgs = await mensajesApi.getByCliente(chatId, 50, offsetRef.current);
      if (fetchIdRef.current !== chatId) return;
      if (msgs.length === 0) { hasMoreRef.current = false; return; }
      idsRef.current = new Set([...idsRef.current].concat(msgs.map((m: Mensaje) => m.id)));
      setMensajes(prev => [...msgs, ...prev]);
      hasMoreRef.current = msgs.length >= 50;
      offsetRef.current += msgs.length;
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - prevHeight;
        }
      });
    } finally {
      loadingMoreRef.current = false;
    }
  };
  cargarMasRef.current = cargarMas;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop < 80) cargarMasRef.current();
      const lejos = el.scrollHeight - el.scrollTop - el.clientHeight > 100;
      setShowScrollBtn(lejos);
      if (!lejos && newMsgCountRef.current > 0) {
        newMsgCountRef.current = 0;
        setNewMsgCount(0);
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [clienteId, mensajes]);

  useEffect(() => {
    if (clienteId && clientes.length > 0) {
      const id = Number(clienteId);
      setSelectedCliente(prev => prev?.id === id ? prev : (clientes.find(c => c.id === id) || prev));
    }
  }, [clienteId, clientes]);

  useEffect(() => {
    if (clienteId && clientes.length > 0 && clientesFiltrados.length > 0) {
      const exists = clientesFiltrados.some(c => c.id === Number(clienteId));
      if (!exists) navigate('/inbox', { replace: true });
    }
  }, [canalFiltro, urgenciaFiltro, filtroIA, searchTerm]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedCliente) return;
    const contenido = nuevoMensaje;
    const tempId = Date.now();
    const tempMsg: Mensaje = {
      id: tempId, cliente_id: selectedCliente.id, remitente: 'agente',
      contenido, tipo: 'texto', leido: true, url_multimedia: null,
      asignado_a: null, fecha_envio: new Date().toISOString(),
    };
    agregarMensaje(tempMsg);
    setNuevoMensaje('');
    try {
      const msg = await mensajesApi.enviar({
        cliente_id: selectedCliente.id, contenido, remitente: 'agente',
      });
      setMensajes(prev => {
        if (prev.some(m => m.id === msg.id)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? msg : m);
      });
      idsRef.current = new Set([...idsRef.current].filter(x => x !== tempId).concat(msg.id));
    } catch {
      setMensajes(prev => prev.filter(m => m.id !== tempId));
      idsRef.current = new Set([...idsRef.current].filter(x => x !== tempId));
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

  const galleryMedia = mensajes
    .filter(m => (m.tipo === 'imagen' || m.tipo === 'video') && m.url_multimedia)
    .map(m => ({ url: m.url_multimedia!, nombre: m.contenido || undefined }));

  return (
    <><div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f6f9fc' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'todos', label: 'All' },
                  { key: 'whatsapp', label: 'WA', color: '#25D366', icon: 'whatsapp' },
                  { key: 'instagram', label: 'IG', color: '#E4405F', icon: 'instagram' },
                  { key: 'facebook', label: 'FB', color: '#1877F2', icon: 'facebook' },
                ].map(f => (
                  <button key={f.key} onClick={() => setCanalFiltro(f.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: canalFiltro === f.key ? (f.key === 'todos' ? '#002045' : '#b51822') : 'transparent',
                      color: canalFiltro === f.key ? '#fff' : '#8896ab',
                      border: canalFiltro === f.key ? 'none' : '1px solid #e0e8f0',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {f.icon && (
                      <svg width={12} height={12} style={{ flexShrink: 0 }}>
                        <use href={`${canalIcono[f.icon]}`} />
                      </svg>
                    )}
                    {f.label}
                  </button>
                ))}
                <button onClick={() => setFiltroIA(!filtroIA)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: filtroIA ? '#b51822' : 'transparent',
                    color: filtroIA ? '#fff' : '#8896ab',
                    border: filtroIA ? 'none' : '1px solid #e0e8f0',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                  <Bot size={11} />
                  IA
                </button>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'todos', label: 'All' },
                  { key: 'urgentes', label: 'Urgent', dot: '#DC2626' },
                  { key: 'interesado', label: 'Interested', dot: '#D97706' },
                  { key: 'neutro', label: 'Neutral', dot: '#9CA3AF' },
                ].map(f => (
                  <button key={f.key} onClick={() => setUrgenciaFiltro(f.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: urgenciaFiltro === f.key ? (f.key === 'urgentes' ? '#b51822' : '#002045') : 'transparent',
                      color: urgenciaFiltro === f.key ? '#fff' : '#8896ab',
                      border: urgenciaFiltro === f.key ? 'none' : '1px solid #e0e8f0',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {f.dot && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.dot }} />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <SkeletonChats /> : (
              clientesFiltrados.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#8896ab' }}>
                  <MessageSquare size={40} style={{ opacity: 0.15, marginBottom: 12, color: '#b51822' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#002045' }}>No hay chats</p>
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
                        background: isSelected ? 'rgba(181,24,34,0.06)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #b51822' : '3px solid transparent',
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
                            background: getAvatarColor(cliente.nombre || cliente.telefono || '?'),
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
                          {unreadChats.has(cliente.id) && (
                            <div style={{
                              position: 'absolute', top: -3, right: -3,
                              width: 14, height: 14, borderRadius: '50%',
                              background: '#DC2626',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px rgba(220,38,38,0.5)',
                            }} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <strong style={{
                              fontSize: 14,
                              fontWeight: unreadChats.has(cliente.id) ? 700 : 600,
                              color: unreadChats.has(cliente.id) ? '#b51822' : '#002045',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {cliente.nombre || cliente.telefono || 'Sin nombre'}
                            </strong>
                            <span style={{
                              fontSize: 11,
                              fontWeight: unreadChats.has(cliente.id) ? 600 : 400,
                              color: unreadChats.has(cliente.id) ? '#b51822' : '#8896ab',
                              flexShrink: 0, marginLeft: 8,
                            }}>
                              {new Date(cliente.ultima_interaccion || Date.now()).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
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
                            {cliente.ultimo_remitente === 'agente'
                              ? <><span style={{ color: '#b51822', fontWeight: 600 }}>tú: </span>{cliente.ultimo_mensaje}</>
                              : (cliente.ultimo_mensaje || 'Sin mensajes')}
                          </div>
                          {cliente.resumen_busqueda && (
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#b51822' }}>
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f6f9fc', position: 'relative' }}>
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
                          background: getAvatarColor(selectedCliente.nombre || selectedCliente.telefono || '?'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 700, color: '#fff',
                        }}>
                          {(selectedCliente.nombre || selectedCliente.telefono || '?').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#b51822', fontFamily: "'Inter', sans-serif" }}>
                          {selectedCliente.nombre || selectedCliente.telefono || 'Sin nombre'}
                        </h3>
                        <span style={{ fontSize: 12, color: '#b51822', fontWeight: 500 }}>
                          {canalLabel[selectedCliente.canal_origen] || selectedCliente.canal_origen}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => selectedCliente?.telefono && window.open(`https://wa.me/${selectedCliente.telefono.replace(/[^0-9]/g, '')}`, '_blank')}
                        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Abrir WhatsApp">
                        <Phone size={14} style={{ color: '#b51822' }} />
                      </button>
                      <button
                        onClick={() => setSearchMode(!searchMode)}
                        style={{ width: 34, height: 34, borderRadius: '50%', border: searchMode ? '2px solid #b51822' : '1px solid #e0e8f0', background: searchMode ? 'rgba(181,24,34,0.08)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title={searchMode ? 'Cerrar búsqueda' : 'Buscar en conversación'}>
                        <Search size={14} style={{ color: '#b51822' }} />
                      </button>
                      <button
                        onClick={() => setShowPanel(!showPanel)}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          border: showPanel ? '2px solid #b51822' : '1px solid #e0e8f0',
                          background: showPanel ? 'rgba(181,24,34,0.08)' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        title={showPanel ? 'Ocultar panel' : 'Mostrar panel'}
                      >
                        {showPanel
                          ? <PanelRightClose size={14} style={{ color: '#b51822' }} />
                          : <PanelRightOpen size={14} style={{ color: '#b51822' }} />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {searchMode && (
                  <div style={{ padding: '8px 20px', borderBottom: '1px solid #e0e8f0', background: '#fff' }}>
                    <input autoFocus
                      value={searchMsg}
                      onChange={e => setSearchMsg(e.target.value)}
                      placeholder="Buscar en la conversación..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d0d8e0', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                )}
                {/* Messages */}
                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                  {messagesLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                      <div className="skeleton" style={{ width: '60%', height: 14 }} />
                      <div className="skeleton" style={{ width: '80%', height: 14 }} />
                      <div className="skeleton" style={{ width: '45%', height: 14 }} />
                      <div className="skeleton" style={{ width: '70%', height: 14, marginTop: 20 }} />
                      <div className="skeleton" style={{ width: '50%', height: 14 }} />
                    </div>
                  ) : mensajes.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8896ab' }}>
                      <MessageSquare size={48} style={{ opacity: 0.12, marginBottom: 16, color: '#b51822' }} />
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#002045' }}>Sin mensajes aún</p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>Envía el primer mensaje para iniciar la conversación</p>
                    </div>
                  ) : (
                    mensajes.filter(msg => msg.cliente_id === Number(clienteId) &&
                      (!searchMsg || msg.contenido.toLowerCase().includes(searchMsg.toLowerCase()))).map((msg) => {
                      const isAgent = msg.remitente === 'agente';
                      const isBot = msg.remitente === 'bot';
                      const isClient = !isAgent && !isBot;
                      return (
                        <div key={msg.id} style={{
                          marginBottom: 6,
                          display: 'flex',
                          flexDirection: isAgent ? 'row-reverse' : 'row',
                          alignItems: 'flex-end',
                          gap: 8,
                        }}>
                          {isBot && (
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#6B7280',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, order: 1,
                            }}>
                              <Bot size={14} color="#fff" />
                            </div>
                          )}
                          {isClient && (
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: getAvatarColor(selectedCliente?.nombre || selectedCliente?.telefono || '?'),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#fff',
                              flexShrink: 0,
                            }}>
                              {(selectedCliente?.nombre || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            background: isBot ? 'var(--msg-bot)' : isAgent ? '#002045' : '#e5eeff',
                            border: isBot ? '1px dashed var(--outline)' : 'none',
                            borderRadius: isAgent
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: isBot ? 'var(--text-primary)' : isAgent ? '#fff' : '#002045',
                          }}>
                            {isBot && (
                              <div style={{
                                fontSize: 10, fontWeight: 600, marginBottom: 4,
                                color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <Bot size={10} /> Bot IA
                              </div>
                            )}
                            {msg.tipo === 'imagen' && msg.url_multimedia && (
                              <>
                                <img src={msg.url_multimedia} alt="imagen" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: msg.contenido ? 2 : 4, cursor: 'pointer', display: 'block' }}
                                  onClick={() => {
                                    const idx = galleryMedia.findIndex(m => m.url === msg.url_multimedia);
                                    setGalleryIndex(idx >= 0 ? idx : 0);
                                  }} />
                                {msg.contenido && (
                                  <div style={{ fontSize: 12, color: isBot ? 'var(--text-secondary)' : isAgent ? 'rgba(255,255,255,0.75)' : 'rgba(0,32,69,0.6)', marginBottom: 4, fontStyle: 'italic' }}>
                                    {msg.contenido}
                                  </div>
                                )}
                              </>
                            )}
                            {msg.tipo === 'audio' && msg.url_multimedia && (
                              <AudioPlayer src={msg.url_multimedia} isAgent={isAgent} />
                            )}
                            {msg.tipo === 'video' && msg.url_multimedia && (
                              <video controls src={msg.url_multimedia} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 4, cursor: 'pointer' }}
                                onClick={() => {
                                  const idx = galleryMedia.findIndex(m => m.url === msg.url_multimedia);
                                  setGalleryIndex(idx >= 0 ? idx : 0);
                                }} />
                            )}
                            {msg.tipo === 'archivo' && msg.url_multimedia && (
                              <FileCard url={msg.url_multimedia} isAgent={isAgent} />
                            )}
                            {(msg.tipo === 'texto' || !msg.url_multimedia) && msg.contenido && (
                              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.contenido}
                              </div>
                            )}
                            <div style={{
                              fontSize: 10, marginTop: 5,
                              color: isBot ? 'var(--text-secondary)' : isAgent ? 'rgba(255,255,255,0.6)' : 'rgba(0,32,69,0.5)',
                              textAlign: 'right',
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
                            }}>
                              {msg._uploading ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <span className="msg-spinner" />
                                  Enviando...
                                </span>
                              ) : msg._error ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#e74c3c' }}>
                                  Error
                                </span>
                              ) : (
                                new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                              )}
                              {isAgent && !msg._uploading && !msg._error && <CheckCheck size={10} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Floating scroll button */}
                {showScrollBtn && (
                  <div onClick={() => {
                    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
                    setShowScrollBtn(false);
                    newMsgCountRef.current = 0;
                    setNewMsgCount(0);
                  }} style={{
                    position: 'absolute', bottom: 76, right: 24, zIndex: 20,
                    width: 40, height: 40, borderRadius: '50%', background: '#b51822', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)', fontSize: 20,
                  }} title="Ir al final">
                    &#x2193;
                    {newMsgCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -6, right: -6, background: '#ff4444', color: '#fff',
                        fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}>{newMsgCount}</span>
                    )}
                  </div>
                )}
                {/* Input */}
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #e0e8f0',
                  background: '#fff',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <input ref={fileInputRef} type="file" hidden accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedCliente) return;
                      const tempId = Date.now() + Math.random();
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      let tipo: Mensaje['tipo'] = 'archivo';
                      if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) tipo = 'imagen';
                      else if (['mp3','wav','ogg','aac','m4a'].includes(ext)) tipo = 'audio';
                      else if (['mp4','webm','mov','avi'].includes(ext)) tipo = 'video';
                      const tempMsg: Mensaje = {
                        id: tempId, cliente_id: selectedCliente.id, remitente: 'agente',
                        contenido: file.name, tipo, url_multimedia: null,
                        leido: true, asignado_a: null, fecha_envio: new Date().toISOString(),
                        _uploading: true,
                      };
                      agregarMensaje(tempMsg);
                      e.target.value = '';
                      try {
                        const { url } = await mensajesApi.upload(file);
                        const msg = await mensajesApi.enviar({
                          cliente_id: selectedCliente.id, remitente: 'agente',
                          contenido: file.name, tipo, url_multimedia: url,
                        });
                        setMensajes(prev => {
                          if (prev.some(m => m.id === msg.id)) return prev.filter(m => m.id !== tempId);
                          return prev.map(m => m.id === tempId ? msg : m);
                        });
                        idsRef.current = new Set([...idsRef.current].filter(x => x !== tempId).concat(msg.id));
                      } catch {
                        setMensajes(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _error: true } : m));
                        toast('error', 'Error al subir archivo');
                      }
                    }}
                  />
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
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
                    onFocus={e => e.currentTarget.style.borderColor = '#b51822'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e0e8f0'}
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
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(181,24,34,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <MessageSquare size={32} style={{ color: '#b51822' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#b51822' }}>Selecciona un chat</p>
                <p style={{ fontSize: 13, marginTop: 4, color: '#5a6a7c' }}>Elige una conversación de la bandeja para comenzar</p>
              </div>
            )}
          </div>

          {/* Right Panel — toggleable */}
          {selectedCliente && showPanel && (
            <ClientPanel cliente={selectedCliente} onClose={() => setShowPanel(false)} />
          )}
        </div>
      </div>
      {galleryIndex !== null && galleryMedia.length > 0 && (
        <GalleryView
          images={galleryMedia}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </>
  );
}

export default Inbox;
