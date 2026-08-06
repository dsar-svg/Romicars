import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Send, MessageSquare, Bot, CheckCheck, Paperclip, Phone, PanelRightOpen, PanelRightClose, FileText, X, UserCheck, UserPlus, Trash2, Pin } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { toast } from '../components/Toast';
import ClientPanel from '../components/ClientPanel';
import TransferAlert from '../components/TransferAlert';
import AudioPlayer from '../components/AudioPlayer';
import FileCard from '../components/FileCard';
import GalleryView from '../components/GalleryView';
import AudioRecorder from '../components/AudioRecorder';
import EmojiPicker from '../components/EmojiPicker';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import type { Cliente, Mensaje } from '../types';
import TypingIndicator from '../components/TypingIndicator';
import InternalNotes from '../components/InternalNotes';
import QuickReplies from '../components/QuickReplies';
import ConfirmDialog from '../components/ConfirmDialog';

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
const esUrlImagen = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url.split('?')[0]);

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
  const { agente } = useAuth();
  const prevClienteId = useRef<string | undefined>(undefined);
  const currentClienteId = useRef<number | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const idsRef = useRef<Set<number>>(new Set());
  const agregarMensaje = (msg: Mensaje) => {
    if (idsRef.current.has(msg.id)) return;
    idsRef.current.add(msg.id);
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
  const sendingAgentMsgRef = useRef(false);
  const scrollToBottomRef = useRef(false);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [pendingAttach, setPendingAttach] = useState<{ url?: string; tipo: Mensaje['tipo']; name: string; _loading?: boolean } | null>(null);
  const uploadIdRef = useRef(0);
  const [filtroAtencion, setFiltroAtencion] = useState('todos');
  const [msgContextMenu, setMsgContextMenu] = useState<{ x: number; y: number; msg: Mensaje } | null>(null);
  const [chatContextMenu, setChatContextMenu] = useState<{ x: number; y: number; cliente: Cliente } | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [hoveredChat, setHoveredChat] = useState<number | null>(null);
  const [activeMsgMenu, setActiveMsgMenu] = useState<number | null>(null);
  const [typingAgents, setTypingAgents] = useState<Map<string, string>>(new Map());
  const [showNotes, setShowNotes] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [slaData, setSlaData] = useState<{ minutos: number; estado: string } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showScrollBtnRef = useRef(false);
  const [confirmData, setConfirmData] = useState<{ titulo: string; mensaje: string; onConfirmar: () => void; tipo?: 'peligro' | 'info' | 'advertencia' } | null>(null);

  useEffect(() => {
    if (!window.__unreadChats) window.__unreadChats = new Set<number>();
    setUnreadChats(new Set(window.__unreadChats));
    const handler = () => setUnreadChats(new Set(window.__unreadChats!));
    window.addEventListener('unread-sync', handler);
    return () => window.removeEventListener('unread-sync', handler);
  }, []);

  const refrescarClienteEnLista = useCallback((clienteId: number) => {
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
  }, []);

  const handleDeleteMessage = async (msg: Mensaje) => {
    setConfirmData({
      titulo: 'Eliminar mensaje',
      mensaje: 'Esta accion no se puede deshacer. El mensaje se eliminara permanentemente.',
      tipo: 'peligro',
      onConfirmar: async () => {
        setConfirmData(null);
        try { await mensajesApi.delete(msg.id); } catch { toast('error', 'Error al eliminar mensaje'); }
        setActiveMsgMenu(null);
      },
    });
  };

  const handlePinMessage = async (msg: Mensaje) => {
    try { await mensajesApi.togglePin(msg.id); } catch { toast('error', 'Error al fijar mensaje'); }
    setActiveMsgMenu(null);
  };

  const handleCopyMessage = (msg: Mensaje) => {
    navigator.clipboard.writeText(msg.contenido).then(() => {
      toast('success', 'Mensaje copiado');
    }).catch(() => {
      toast('error', 'Error al copiar');
    });
    setActiveMsgMenu(null);
  };

  const handleDeleteChat = async (cliente: Cliente) => {
    setConfirmData({
      titulo: 'Eliminar conversacion',
      mensaje: `Se eliminaran todos los mensajes de ${cliente.nombre || cliente.telefono}. Esta accion no se puede deshacer.`,
      tipo: 'peligro',
      onConfirmar: async () => {
        setConfirmData(null);
        try { await clientesApi.deleteChat(cliente.id); } catch { toast('error', 'Error al eliminar chat'); }
        setChatContextMenu(null);
      },
    });
    setChatContextMenu(null);
  };

  const handlePinChat = async (cliente: Cliente) => {
    try { await clientesApi.togglePin(cliente.id); } catch { toast('error', 'Error al fijar chat'); }
    setChatContextMenu(null);
  };

  useEffect(() => {
    const socket = connectSocket();
    clientesApi.getAll().then(data => {
      setClientes(data);
      setLoading(false);
    });

    socket.on('message:new', (mensaje: Mensaje) => {
      if (sendingAgentMsgRef.current && mensaje.remitente === 'agente') return;
      const isCurrent = currentClienteId.current === mensaje.cliente_id;
      if (isCurrent) {
        agregarMensaje(mensaje);
        if (showScrollBtnRef.current) {
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

    socket.on('chat:transferido', (cliente: Cliente) => {
      new Audio('/sounds/notification.mp3').play().catch(() => {});
      toast('info', `Nuevo chat: ${cliente.nombre || cliente.telefono}`);
      refrescarClienteEnLista(cliente.id);
    });

    socket.on('chat:asignado', (data: { cliente: Cliente; agente: any }) => {
      refrescarClienteEnLista(data.cliente.id);
      if (data.agente.id !== agente?.id) {
        toast('info', `${data.agente.nombre} tomo el chat de ${data.cliente.nombre || data.cliente.telefono}`);
      }
    });

    socket.on('chat:liberado', (cliente: Cliente) => {
      refrescarClienteEnLista(cliente.id);
      toast('info', `Chat liberado: ${cliente.nombre || cliente.telefono}`);
    });

    socket.on('chat:deleted', (data: { cliente_id: number }) => {
      setClientes(prev => prev.filter(c => c.id !== data.cliente_id));
      if (selectedCliente?.id === data.cliente_id) { navigate('/inbox'); }
      toast('info', 'Chat eliminado');
    });

    socket.on('message:deleted', (data: { mensaje_id: number; cliente_id: number }) => {
      setMensajes(prev => prev.filter(m => m.id !== data.mensaje_id));
      idsRef.current.delete(data.mensaje_id);
    });

    socket.on('chat:pinned', (data: { cliente_id: number; pinned: boolean }) => {
      setClientes(prev => {
        const updated = prev.map(c => c.id === data.cliente_id ? { ...c, pinned: data.pinned } : c);
        return [...updated].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      });
    });

    socket.on('message:pinned', (data: { mensaje_id: number; pinned: boolean }) => {
      setMensajes(prev => prev.map(m => m.id === data.mensaje_id ? { ...m, pinned: data.pinned } : m));
    });

    socket.on('typing:started', (data: { cliente_id: number; agente_id: string; nombre: string }) => {
      if (currentClienteId.current === data.cliente_id) {
        setTypingAgents(prev => new Map(prev).set(data.agente_id, data.nombre));
      }
    });

    socket.on('typing:stopped', (data: { cliente_id: number; agente_id: string }) => {
      setTypingAgents(prev => {
        const next = new Map(prev);
        next.delete(data.agente_id);
        return next;
      });
    });

    return () => {
      socket.off('message:new');
      socket.off('chat:updated');
      socket.off('cliente:updated');
      socket.off('chat:transferido');
      socket.off('chat:asignado');
      socket.off('chat:liberado');
      socket.off('chat:deleted');
      socket.off('message:deleted');
      socket.off('chat:pinned');
      socket.off('message:pinned');
      socket.off('typing:started');
      socket.off('typing:stopped');
    };
  }, [refrescarClienteEnLista, agente, navigate]);

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
    clientesApi.getSla(id).then(data => {
      setSlaData({ minutos: data.minutos_transcurridos, estado: data.estado_conversacion });
    }).catch(() => {});

    const load = async (chatId: number) => {
      const msgs = await mensajesApi.getByCliente(chatId, 20) as Mensaje[];
      if (fetchIdRef.current !== chatId) return;
      idsRef.current = new Set(msgs.map(m => m.id));
      setMensajes(msgs);
      scrollToBottomRef.current = true;
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
    showScrollBtnRef.current = showScrollBtn;
  }, [showScrollBtn]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredMsgs = useMemo(() => {
    const id = Number(clienteId);
    const s = searchMsg.toLowerCase();
    return mensajes.filter(msg => msg.cliente_id === id && (!s || msg.contenido.toLowerCase().includes(s)));
  }, [mensajes, clienteId, searchMsg]);

  useEffect(() => {
    clearNotifications();
    const handleVisibility = () => { if (!document.hidden) clearNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clienteId]);

  useEffect(() => {
    const handleClick = () => { setMsgContextMenu(null); setChatContextMenu(null); setActiveMsgMenu(null); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Polling para sincronizar con cambios en la BD (eliminaciones directas)
  useEffect(() => {
    const interval = setInterval(() => {
      clientesApi.getAll().then(data => setClientes(data)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const interval = setInterval(() => {
      clientesApi.getSla(Number(clienteId)).then(data => {
        setSlaData({ minutos: data.minutos_transcurridos, estado: data.estado_conversacion });
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    const interval = setInterval(() => {
      const id = Number(clienteId);
      mensajesApi.getByCliente(id, 200).then((msgs: Mensaje[]) => {
        if (fetchIdRef.current !== id) return;
        idsRef.current = new Set(msgs.map(m => m.id));
        setMensajes(msgs);
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [clienteId]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || loadingMoreRef.current) return;
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current = false;
      el.scrollTop = el.scrollHeight;
      return;
    }
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
  }, [clienteId]);

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
    if (!selectedCliente) return;
    const hasText = nuevoMensaje.trim().length > 0;
    const attach = pendingAttach;
    if (!hasText && !attach) return;
    sendingAgentMsgRef.current = true;

    const sendOne = async (payload: { cliente_id: number; contenido: string; remitente: string; tipo?: string; url_multimedia?: string }, tempId: number, noUpload?: boolean) => {
      agregarMensaje({
        id: tempId, cliente_id: selectedCliente.id, remitente: 'agente',
        contenido: payload.contenido, tipo: (payload.tipo || 'texto') as Mensaje['tipo'],
        url_multimedia: payload.url_multimedia || null,
        leido: true, asignado_a: null, fecha_envio: new Date().toISOString(),
        _uploading: !noUpload,
      } as Mensaje);
      try {
        const msg = await mensajesApi.enviar(payload);
        setMensajes(prev => {
          if (prev.some(m => m.id === msg.id)) return prev.filter(m => m.id !== tempId);
          return prev.map(m => m.id === tempId ? msg : m);
        });
        idsRef.current = new Set([...idsRef.current].filter(x => x !== tempId).concat(msg.id));
      } catch {
        setMensajes(prev => prev.filter(m => m.id !== tempId));
        idsRef.current = new Set([...idsRef.current].filter(x => x !== tempId));
        throw new Error('Error');
      }
    };

    try {
      if (attach && hasText) {
        const t1 = Date.now();
        await sendOne({
          cliente_id: selectedCliente.id, remitente: 'agente',
          contenido: nuevoMensaje.trim(), tipo: attach.tipo, url_multimedia: attach.url,
        }, t1, true);
        setPendingAttach(null);
        setNuevoMensaje('');
      } else if (attach) {
        const t1 = Date.now();
        await sendOne({
          cliente_id: selectedCliente.id, remitente: 'agente',
          contenido: attach.name, tipo: attach.tipo, url_multimedia: attach.url,
        }, t1, true);
        setPendingAttach(null);
      } else {
        const t1 = Date.now();
        await sendOne({
          cliente_id: selectedCliente.id, remitente: 'agente',
          contenido: nuevoMensaje.trim(),
        }, t1);
        setNuevoMensaje('');
      }
    } catch {
      toast('error', 'Error al enviar mensaje');
    }
    sendingAgentMsgRef.current = false;
  };

  const clientesFiltrados = clientes.filter(c => {
    if (canalFiltro !== 'todos' && c.canal_origen !== canalFiltro) return false;
    if (urgenciaFiltro === 'urgentes' && c.urgencia !== 'Alta') return false;
    if (urgenciaFiltro === 'interesado' && c.estado_venta !== 'Interesado') return false;
    if (urgenciaFiltro === 'neutro' && c.estado_venta !== 'Lead') return false;
    if (filtroIA && !c.resumen_busqueda) return false;
    if (filtroAtencion === 'sin_asignar' && c.asignado_a !== null) return false;
    if (filtroAtencion === 'mis_chats' && c.asignado_a !== agente?.id) return false;
    if (filtroAtencion === 'bot' && c.modo_atencion !== 'bot') return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const name = (c.nombre || '').toLowerCase();
      const phone = (c.telefono || '').toLowerCase();
      if (!name.includes(s) && !phone.includes(s)) return false;
    }
    return true;
  });

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Alta': return '#DC2626';
      case 'Media': return '#D97706';
      case 'Baja': return '#2563EB';
      default: return '#9CA3AF';
    }
  };

  const galleryMedia = useMemo(() => mensajes
    .filter(m => m.url_multimedia && (m.tipo === 'imagen' || m.tipo === 'video' || (m.tipo === 'archivo' && esUrlImagen(m.url_multimedia))))
    .map(m => ({ url: m.url_multimedia!, nombre: m.contenido || undefined })),
  [mensajes]);

  const pinnedMsgs = useMemo(() => mensajes.filter(m => !!m.pinned), [mensajes]);

  return (
    <><style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style><div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f6f9fc' }}>
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
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { key: 'todos', label: 'All' },
                  { key: 'sin_asignar', label: 'Sin Asignar', icon: UserPlus },
                  { key: 'mis_chats', label: 'Mis Chats', icon: UserCheck },
                  { key: 'bot', label: 'Bot', icon: Bot },
                ].map(f => (
                  <button key={f.key} onClick={() => setFiltroAtencion(f.key)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: filtroAtencion === f.key
                        ? (f.key === 'sin_asignar' ? '#D97706' : f.key === 'mis_chats' ? '#002045' : '#b51822')
                        : 'transparent',
                      color: filtroAtencion === f.key ? '#fff' : '#8896ab',
                      border: filtroAtencion === f.key ? 'none' : '1px solid #e0e8f0',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    {f.icon && <f.icon size={11} />}
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
                      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setChatContextMenu({ x: e.clientX, y: e.clientY, cliente }); }}
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
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f6f9fc'; setHoveredChat(cliente.id); }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; setHoveredChat(null); }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
                              {!!cliente.pinned && (
                                <span title="Chat fijado" style={{ display: 'inline-flex', flexShrink: 0 }}>
                                  <Pin size={11} style={{ color: '#D97706' }} />
                                </span>
                              )}
                              <strong style={{
                                fontSize: 14,
                                fontWeight: unreadChats.has(cliente.id) ? 700 : 600,
                                color: unreadChats.has(cliente.id) ? '#b51822' : '#002045',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {cliente.nombre || cliente.telefono || 'Sin nombre'}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                              {hoveredChat === cliente.id && (
                                <>
                                  <button onClick={e => { e.stopPropagation(); handlePinChat(cliente); }} style={{
                                    width: 22, height: 22, borderRadius: 4, border: 'none',
                                    background: cliente.pinned ? '#FEF3C7' : 'transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }} title={cliente.pinned ? 'Desfijar' : 'Fijar'}>
                                    <Pin size={11} style={{ color: cliente.pinned ? '#D97706' : '#8896ab' }} />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); handleDeleteChat(cliente); }} style={{
                                    width: 22, height: 22, borderRadius: 4, border: 'none',
                                    background: 'transparent', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }} title="Eliminar chat">
                                    <Trash2 size={11} style={{ color: '#DC2626' }} />
                                  </button>
                                </>
                              )}
                              <span style={{
                                fontSize: 11,
                                fontWeight: unreadChats.has(cliente.id) ? 600 : 400,
                                color: unreadChats.has(cliente.id) ? '#b51822' : '#8896ab',
                              }}>
                                {new Date(cliente.ultima_interaccion || Date.now()).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
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
                            {cliente.modo_atencion === 'transfiriendo' && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: '#fff', background: '#D97706' }}>
                                Pendiente
                              </span>
                            )}
                            {cliente.modo_atencion === 'bot' && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: '#fff', background: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Bot size={9} /> Bot
                              </span>
                            )}
                            {cliente.modo_atencion === 'agente' && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, color: '#fff', background: '#002045', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <UserCheck size={9} /> Agente
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
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          {(['nuevo', 'en_progreso', 'resuelto', 'cerrado', 'en_pausa'] as const).map(estado => {
                            const config: Record<string, { label: string; color: string; icon: string }> = {
                              nuevo: { label: 'Nuevo', color: '#DC2626', icon: '🔴' },
                              en_progreso: { label: 'En progreso', color: '#2563EB', icon: '🔵' },
                              resuelto: { label: 'Resuelto', color: '#059669', icon: '✅' },
                              cerrado: { label: 'Cerrado', color: '#6B7280', icon: '⭕' },
                              en_pausa: { label: 'En pausa', color: '#D97706', icon: '⏸️' },
                            };
                            const cfg = config[estado];
                            const isActive = selectedCliente.estado_conversacion === estado;
                            return (
                              <button key={estado} onClick={async () => {
                                try {
                                  const updated = await clientesApi.updateStatus(selectedCliente.id, estado);
                                  setSelectedCliente(updated);
                                  refrescarClienteEnLista(selectedCliente.id);
                                  if (estado === 'resuelto' || estado === 'cerrado') {
                                    setSlaData(null);
                                  } else if (updated.sla_inicio) {
                                    const diff = Math.floor((Date.now() - new Date(updated.sla_inicio).getTime()) / 60000);
                                    setSlaData({ minutos: diff, estado: updated.estado_conversacion });
                                  } else {
                                    setSlaData({ minutos: 0, estado: updated.estado_conversacion });
                                  }
                                } catch {
                                  toast('error', 'Error al cambiar estado');
                                }
                              }} style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: isActive ? cfg.color : 'transparent',
                                color: isActive ? '#fff' : cfg.color,
                                border: `1.5px solid ${cfg.color}`,
                                cursor: 'pointer',
                                opacity: isActive ? 1 : 0.65,
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 4,
                                boxShadow: isActive ? `0 2px 8px ${cfg.color}33` : 'none',
                              }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = `${cfg.color}11`; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.background = 'transparent'; } }}
                              >
                                <span style={{ fontSize: 8 }}>{cfg.icon}</span>
                                {cfg.label}
                              </button>
                            );
                          })}
                        </div>
                        {slaData && slaData.minutos > 0 && slaData.estado !== 'resuelto' && slaData.estado !== 'cerrado' && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                            padding: '3px 10px', borderRadius: 12,
                            background: slaData.minutos > 15 ? '#FEF2F2' : slaData.minutos > 5 ? '#FFFBEB' : '#ECFDF5',
                            border: `1px solid ${slaData.minutos > 15 ? '#FECACA' : slaData.minutos > 5 ? '#FDE68A' : '#A7F3D0'}`,
                            fontSize: 11, fontWeight: 700,
                            color: slaData.minutos > 15 ? '#DC2626' : slaData.minutos > 5 ? '#D97706' : '#059669',
                          }}>
                            <div style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: slaData.minutos > 15 ? '#DC2626' : slaData.minutos > 5 ? '#D97706' : '#059669',
                              animation: 'pulse 1.5s infinite',
                            }} />
                            SLA: {slaData.minutos} min
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {selectedCliente?.telefono && (
                        <a href={`tel:${selectedCliente.telefono}`} style={{
                          width: 34, height: 34, borderRadius: '50%',
                          border: '1px solid #e0e8f0', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', textDecoration: 'none',
                        }} title="Llamar">
                          <Phone size={14} style={{ color: '#217346' }} />
                        </a>
                      )}
                      <button
                        onClick={() => selectedCliente?.telefono && window.open(`https://wa.me/${selectedCliente.telefono.replace(/[^0-9]/g, '')}`, '_blank')}
                        style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Abrir WhatsApp">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
                      <button
                        onClick={() => setShowNotes(!showNotes)}
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          border: showNotes ? '2px solid #D97706' : '1px solid #e0e8f0',
                          background: showNotes ? '#FEF3C7' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title={showNotes ? 'Ocultar notas' : 'Notas internas'}
                      >
                        <span style={{ fontSize: 14 }}>📝</span>
                      </button>
                    </div>
                  </div>
                </div>

                {searchMode && (
                  <div style={{ padding: '8px 20px', borderBottom: '1px solid #e0e8f0', background: '#fff' }}>
                    <input autoFocus
                      value={searchMsg}
                      onChange={e => setSearchMsg(e.target.value)}
                      placeholder="Buscar en la conversacion..."
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d0d8e0', borderRadius: 8, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                )}
                <TransferAlert
                  cliente={selectedCliente}
                  onTakeover={(updated) => {
                    setSelectedCliente(updated);
                    refrescarClienteEnLista(updated.id);
                  }}
                />
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
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#002045' }}>Sin mensajes aun</p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>Envia el primer mensaje para iniciar la conversacion</p>
                    </div>
                  ) : (
                    <>
                      {pinnedMsgs.length > 0 && (
                        <div style={{
                          marginBottom: 12, padding: '8px 12px', background: '#FEF3C7',
                          borderRadius: 8, border: '1px solid #FDE68A',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <Pin size={14} style={{ color: '#D97706', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#92400E', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pinnedMsgs.length === 1
                              ? `Mensaje fijado: "${pinnedMsgs[0].contenido}"`
                              : `${pinnedMsgs.length} mensajes fijados`}
                          </span>
                          <button onClick={() => {
                            const firstPinned = pinnedMsgs[0];
                            if (firstPinned) {
                              const el = document.getElementById(`msg-${firstPinned.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }} style={{
                            fontSize: 12, color: '#D97706', fontWeight: 600, background: 'none',
                            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>
                            Ver
                          </button>
                        </div>
                      )}
                      {typingAgents.size > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {Array.from(typingAgents.entries()).map(([id, nombre]) => (
                            <TypingIndicator key={id} nombre={nombre} />
                          ))}
                        </div>
                      )}
                      {filteredMsgs.map((msg) => {
                      const isAgent = msg.remitente === 'agente';
                      const isBot = msg.remitente === 'bot';
                      const isClient = !isAgent && !isBot;
                      return (
                        <div key={msg.id} style={{ marginBottom: 6, maxWidth: '85%' }}
                          onMouseEnter={() => setHoveredMsg(msg.id)}
                          onMouseLeave={() => { setHoveredMsg(null); setActiveMsgMenu(null); }}
                        >
                          <div id={`msg-${msg.id}`} style={{
                            display: 'flex', flexDirection: isAgent ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 4,
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
                            position: 'relative',
                            background: isBot
                              ? 'linear-gradient(135deg, #f8f9fc 0%, #f0f2f8 100%)'
                              : isAgent
                                ? 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)'
                                : 'linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)',
                            border: isBot ? '1px solid #e2e8f0' : isAgent ? 'none' : '1px solid #c7d2fe',
                            borderRadius: isAgent
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: isBot ? 'var(--text-primary)' : isAgent ? '#fff' : '#1e293b',
                            boxShadow: isBot
                              ? '0 1px 3px rgba(0,0,0,0.06)'
                              : isAgent
                                ? '0 2px 8px rgba(0,32,69,0.2)'
                                : '0 1px 3px rgba(0,0,0,0.08)',
                          }}>
                            {hoveredMsg === msg.id && activeMsgMenu !== msg.id && (
                              <button onClick={(e) => { e.stopPropagation(); setActiveMsgMenu(msg.id); }} style={{
                                position: 'absolute', top: 4, [isAgent ? 'left' : 'right']: 4,
                                width: 22, height: 22, borderRadius: 4, border: 'none',
                                background: isAgent ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                                cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.15s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              >
                                <span style={{ fontSize: 14, color: isAgent ? 'rgba(255,255,255,0.7)' : '#5a6a7c', lineHeight: 1 }}>⋮</span>
                              </button>
                            )}
                            {activeMsgMenu === msg.id && (
                              <div style={{
                                position: 'absolute', top: 28, [isAgent ? 'left' : 'right']: 0,
                                background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                zIndex: 20, minWidth: 140, padding: '4px 0', color: '#002045',
                              }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleCopyMessage(msg)} style={{
                                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
                                  border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f6f9fc'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  Copiar
                                </button>
                                <button onClick={() => handlePinMessage(msg)} style={{
                                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
                                  border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f6f9fc'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  {msg.pinned ? 'Desfijar' : 'Fijar'}
                                </button>
                                <button onClick={() => handleDeleteMessage(msg)} style={{
                                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
                                  border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                                  color: '#DC2626',
                                }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                            {isBot && (
                              <div style={{
                                fontSize: 10, fontWeight: 600, marginBottom: 4,
                                color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <Bot size={10} /> Bot IA
                              </div>
                            )}
                            {msg.tipo === 'imagen' && msg.url_multimedia && !msg._uploading && (
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
                            {msg._uploading && (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4,
                                borderRadius: 8,
                                background: isAgent ? 'rgba(255,255,255,0.1)' : 'rgba(0,32,69,0.04)',
                                border: `1px solid ${isAgent ? 'rgba(255,255,255,0.15)' : 'rgba(0,32,69,0.1)'}`,
                              }}>
                                <div style={{
                                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                                  background: isAgent ? '#8896ab' : '#f0f2f5',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <span className="msg-spinner" style={{ borderColor: isAgent ? 'rgba(255,255,255,0.6)' : '#8896ab', borderTopColor: 'transparent', width: 16, height: 16, borderWidth: 2 }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: isAgent ? '#fff' : '#002045',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {msg.contenido}
                                  </div>
                                  <div style={{ fontSize: 11, color: isAgent ? 'rgba(255,255,255,0.6)' : '#8896ab', marginTop: 2 }}>
                                    Subiendo...
                                  </div>
                                </div>
                              </div>
                            )}
                            {msg.tipo === 'archivo' && msg.url_multimedia && !msg._uploading && (
                              <>{esUrlImagen(msg.url_multimedia) ? (
                                <img src={msg.url_multimedia} alt="imagen" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: msg.contenido ? 2 : 4, cursor: 'pointer', display: 'block' }}
                                  onClick={() => {
                                    const idx = galleryMedia.findIndex(m => m.url === msg.url_multimedia);
                                    setGalleryIndex(idx >= 0 ? idx : 0);
                                  }} />
                              ) : (
                                <FileCard url={msg.url_multimedia} isAgent={isAgent} />
                              )}
                                {msg.contenido && (
                                  <div style={{ fontSize: 12, color: isBot ? 'var(--text-secondary)' : isAgent ? 'rgba(255,255,255,0.75)' : 'rgba(0,32,69,0.6)', marginTop: 4, fontStyle: 'italic' }}>
                                    {msg.contenido}
                                  </div>
                                )}
                              </>
                            )}
                            {msg.tipo === 'audio' && msg.url_multimedia && !msg._uploading && (
                              <><AudioPlayer src={msg.url_multimedia} isAgent={isAgent} />
                                {msg.contenido && (
                                  <div style={{ fontSize: 12, color: isBot ? 'var(--text-secondary)' : isAgent ? 'rgba(255,255,255,0.75)' : 'rgba(0,32,69,0.6)', marginTop: 4, fontStyle: 'italic' }}>
                                    {msg.contenido}
                                  </div>
                                )}
                              </>
                            )}
                            {msg.tipo === 'video' && msg.url_multimedia && !msg._uploading && (
                              <><video controls src={msg.url_multimedia} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 4, cursor: 'pointer' }}
                                onClick={() => {
                                  const idx = galleryMedia.findIndex(m => m.url === msg.url_multimedia);
                                  setGalleryIndex(idx >= 0 ? idx : 0);
                                }} />
                                {msg.contenido && (
                                  <div style={{ fontSize: 12, color: isBot ? 'var(--text-secondary)' : isAgent ? 'rgba(255,255,255,0.75)' : 'rgba(0,32,69,0.6)', marginTop: 4, fontStyle: 'italic' }}>
                                    {msg.contenido}
                                  </div>
                                )}
                              </>
                            )}
                            {(msg.tipo === 'texto' || (!msg.url_multimedia && !msg._uploading)) && msg.contenido && (
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
                              {!!msg.pinned && (
                                <span style={{ fontSize: 10 }} title="Mensaje fijado">📌</span>
                              )}
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
                        </div>
                      );
                    })}
                    </>
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
                {/* Pending attachment preview */}
                {pendingAttach && (
                  <div style={{
                    padding: '8px 20px', background: '#fff5f5', borderTop: '1px solid #e0e8f0',
                    display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                  }}>
                    {pendingAttach._loading ? (
                      <div style={{ width: 36, height: 36, borderRadius: 4, background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="msg-spinner" style={{ borderColor: '#8896ab', borderTopColor: 'transparent', width: 14, height: 14, borderWidth: 2 }} />
                      </div>
                    ) : pendingAttach.tipo === 'imagen' && pendingAttach.url
                      ? <img src={pendingAttach.url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />
                      : <FileText size={18} style={{ color: '#b51822' }} />
                    }
                    <span style={{ flex: 1, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingAttach.name}</span>
                    {pendingAttach._loading ? (
                      <span style={{ fontSize: 11, color: '#8896ab' }}>Subiendo...</span>
                    ) : (
                      <button onClick={() => setPendingAttach(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b51822', padding: 4 }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
                {/* Input */}
                <div style={{
                  padding: '12px 20px',
                  borderTop: pendingAttach ? 'none' : '1px solid #e0e8f0',
                  background: '#fff',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <input ref={fileInputRef} type="file" hidden accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedCliente) return;
                      e.target.value = '';
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      let tipo: Mensaje['tipo'] = 'archivo';
                      if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) tipo = 'imagen';
                      else if (['mp3','wav','ogg','aac','m4a'].includes(ext)) tipo = 'audio';
                      else if (['mp4','webm','mov','avi'].includes(ext)) tipo = 'video';
                      const uploadId = ++uploadIdRef.current;
                      setPendingAttach({ _loading: true, tipo, name: file.name });
                      try {
                        const { url } = await mensajesApi.upload(file);
                        if (uploadIdRef.current !== uploadId) return;
                        setPendingAttach(prev => prev ? { ...prev, url, _loading: false } : null);
                      } catch (err: any) {
                        if (uploadIdRef.current !== uploadId) return;
                        setPendingAttach(null);
                        toast('error', err?.response?.data?.error || err?.message || 'Error al subir archivo');
                      }
                    }}
                  />
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e0e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Paperclip size={14} style={{ color: '#8896ab' }} />
                  </button>
                  {selectedCliente && <AudioRecorder clienteId={selectedCliente.id} />}
                  <div style={{ flex: 1, position: 'relative' }}>
                    {showQuickReplies && (
                      <QuickReplies
                        onSelect={(texto) => { setNuevoMensaje(texto); setShowQuickReplies(false); }}
                        onClose={() => setShowQuickReplies(false)}
                      />
                    )}
                    <input
                      value={nuevoMensaje}
                      onChange={e => {
                        setNuevoMensaje(e.target.value);
                        const socket = getSocket();
                        socket.emit('typing:start', { cliente_id: selectedCliente?.id, nombre: agente?.nombre || 'Agente' });
                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        typingTimeoutRef.current = setTimeout(() => {
                          socket.emit('typing:stop', { cliente_id: selectedCliente?.id });
                        }, 2000);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && !pendingAttach?._loading) { e.preventDefault(); enviarMensaje(); }
                        if (e.key === '/' && !nuevoMensaje) { e.preventDefault(); setShowQuickReplies(true); }
                        if (e.key === 'Escape') setShowQuickReplies(false);
                      }}
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
                  <EmojiPicker onSelect={emoji => setNuevoMensaje(prev => prev + emoji)} />
                  <button
                    onClick={enviarMensaje}
                    disabled={!nuevoMensaje.trim() && !pendingAttach}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: (nuevoMensaje.trim() || pendingAttach) && !pendingAttach?._loading ? '#b51822' : '#e0e8f0',
                      border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: (nuevoMensaje.trim() || pendingAttach) && !pendingAttach?._loading ? 'pointer' : 'not-allowed',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}
                  >
                    <Send size={14} style={{ color: (nuevoMensaje.trim() || pendingAttach) && !pendingAttach?._loading ? '#fff' : '#8896ab' }} />
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
          {selectedCliente && showNotes && (
            <InternalNotes clienteId={selectedCliente.id} onClose={() => setShowNotes(false)} />
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

      {msgContextMenu && (
        <div style={{
          position: 'fixed', left: Math.min(msgContextMenu.x, window.innerWidth - 200), top: Math.min(msgContextMenu.y, window.innerHeight - 120),
          background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999, minWidth: 160, padding: '4px 0',
        }} onClick={e => e.stopPropagation()}>
          <button onClick={() => handlePinMessage(msgContextMenu.msg)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f6f9fc'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {msgContextMenu.msg.pinned ? 'Desfijar mensaje' : 'Fijar mensaje'}
          </button>
          <button onClick={() => handleDeleteMessage(msgContextMenu.msg)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
            color: '#DC2626',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Eliminar mensaje
          </button>
        </div>
      )}

      {chatContextMenu && (
        <div style={{
          position: 'fixed', left: Math.min(chatContextMenu.x, window.innerWidth - 220), top: Math.min(chatContextMenu.y, window.innerHeight - 120),
          background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999, minWidth: 180, padding: '4px 0',
        }} onClick={e => e.stopPropagation()}>
          <button onClick={() => handlePinChat(chatContextMenu.cliente)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f6f9fc'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {chatContextMenu.cliente.pinned ? 'Desfijar chat' : 'Fijar chat'}
          </button>
          <button onClick={() => handleDeleteChat(chatContextMenu.cliente)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
            border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
            color: '#DC2626',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Eliminar chat
          </button>
        </div>
      )}
      {confirmData && (
        <ConfirmDialog
          titulo={confirmData.titulo}
          mensaje={confirmData.mensaje}
          tipo={confirmData.tipo || 'peligro'}
          onConfirmar={confirmData.onConfirmar}
          onCancelar={() => setConfirmData(null)}
        />
      )}
    </>
  );
}

export default Inbox;
