import { useEffect, useState } from 'react';
import {
  Send, Filter, History, AlertCircle, Target, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, BarChart3, Eye, Smartphone, Megaphone,
  Clock, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';

interface Campania {
  id: number;
  nombre: string;
  mensaje: string;
  destinatarios: number;
  enviados: number;
  estado: string;
  creador_nombre: string;
  total_enviados: number;
  created_at: string;
}

interface CampaniaLog {
  id: number;
  campania_id: number;
  cliente_nombre: string;
  telefono: string;
  estado: string;
  error_msg: string | null;
  enviado_en: string | null;
}

function Campañas() {
  const T = useTheme();
  const { agente } = useAuth();
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [estadoVenta, setEstadoVenta] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [expandedCampana, setExpandedCampana] = useState<number | null>(null);
  const [campaniaLogs, setCampaniaLogs] = useState<Record<number, CampaniaLog[]>>({});
  const [loadingLog, setLoadingLog] = useState(false);

  const estadoEstilos: Record<string, { color: string; bg: string; label: string }> = {
    completada: { color: T.greenText, bg: T.greenBg, label: 'Completada' },
    enviando: { color: T.amberText, bg: T.amberBg, label: 'Enviando' },
    borrador: { color: T.grayText, bg: T.grayBg, label: 'Borrador' },
    cancelada: { color: T.redText, bg: T.redBg, label: 'Cancelada' },
  };

  useEffect(() => { api.get('/campanias').then(r => setCampanias(r.data)).catch(() => {}); }, []);

  const toggleLog = async (campaniaId: number) => {
    if (expandedCampana === campaniaId) {
      setExpandedCampana(null);
      return;
    }
    setExpandedCampana(campaniaId);
    if (campaniaLogs[campaniaId]) return;
    setLoadingLog(true);
    try {
      const { data } = await api.get(`/campanias/${campaniaId}/log`);
      setCampaniaLogs(prev => ({ ...prev, [campaniaId]: data }));
    } catch {
      toast('error', 'Error al cargar historial');
    } finally {
      setLoadingLog(false);
    }
  };

  const cargarPreview = async () => {
    try {
      const params = new URLSearchParams();
      if (marca) params.set('marca', marca);
      if (modelo) params.set('modelo', modelo);
      if (estadoVenta) params.set('estado_venta', estadoVenta);
      const r = await api.get(`/campanias/preview?${params}`);
      setPreview(r.data);
      setPreviewCount(r.data.length);
    } catch { toast('error', 'Error al obtener preview'); }
  };

  useEffect(() => { cargarPreview(); }, [marca, modelo, estadoVenta]);

  const enviarCampania = async () => {
    if (!nombre.trim()) { toast('error', 'Ingresa un nombre para la campaña'); return; }
    if (!mensaje.trim()) { toast('error', 'Escribe el mensaje de la campaña'); return; }
    if (previewCount === 0) { toast('error', 'No hay destinatarios con esos filtros'); return; }
    setSending(true);
    try {
      const { data: campania } = await api.post('/campanias', {
        nombre, mensaje, destinatarios: previewCount, creada_por: agente?.id,
      });

      const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.supricom.com.ve/webhook/enviar-campania';
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaniaId: campania.id,
          mensajeBase: mensaje,
          clientes: preview.map(c => ({ id: c.id, nombre: c.nombre, telefono: c.telefono, modelo_carro: c.modelo_carro })),
        }),
      });

      toast('success', `Campaña "${nombre}" enviada a ${previewCount} contactos`);
      setCampanias(prev => [{ ...campania, creador_nombre: agente?.nombre || '', total_enviados: 0 }, ...prev]);
      setNombre(''); setMensaje('');
    } catch { toast('error', 'Error al enviar campaña'); }
    finally { setSending(false); }
  };

  const glassCard: React.CSSProperties = {
    background: T.bgCard,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${T.borderCard}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: T.shadowCard,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: T.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  };

  const iconBadge = (gradient: string): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    background: gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 12px ${gradient.includes('#') ? gradient.match(/#[a-f0-9]+/i)?.[0] || '#000' : '#000'}33`,
  });

  const totalEnviados = campanias.reduce((sum, c) => sum + (c.total_enviados || c.enviados || 0), 0);
  const totalDestinatarios = campanias.reduce((sum, c) => sum + (c.destinatarios || 0), 0);
  const tasaEnvio = totalDestinatarios > 0 ? Math.round((totalEnviados / totalDestinatarios) * 100) : 0;
  const campaniasActivas = campanias.filter(c => c.estado === 'enviando').length;

  const previewMessage = mensaje || 'Hola {nombre}, tenemos ofertas especiales para tu {modelo}...';

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={iconBadge('linear-gradient(135deg, #f43f5e, #e11d48)')}>
            <Megaphone size={18} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.03em', fontFamily: "'Hanken Grotesk', sans-serif", margin: 0 }}>
            Campañas de Remarketing
          </h1>
        </div>
        <p style={{ color: T.textSecondary, marginLeft: 50, fontSize: 14, fontWeight: 500 }}>
          Segmenta y envía promociones sin pagar plantillas de Meta
        </p>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24, marginBottom: 28 }} className="fade-in-up" data-animation-delay="50ms">
        {[
          { label: 'Total Campañas', value: campanias.length, icon: BarChart3, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: '#3b82f6' },
          { label: 'Enviados', value: totalEnviados, icon: Send, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: '#10b981' },
          { label: 'Tasa de Envío', value: `${tasaEnvio}%`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: '#f59e0b' },
          { label: 'Campañas Activas', value: campaniasActivas, icon: Eye, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: '#8b5cf6' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="fade-in-up" style={{
              ...glassCard,
              display: 'flex', alignItems: 'center', gap: 16,
              animationDelay: `${i * 60}ms`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${kpi.shadow}22`; e.currentTarget.style.borderColor = `${kpi.shadow}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadowCard; e.currentTarget.style.borderColor = T.borderCard; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: kpi.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${kpi.shadow}44`,
              }}>
                <Icon size={24} color="#fff" />
              </div>
              <div>
                <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, marginTop: 2, fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: '-0.03em' }}>{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }} className="fade-in-up" data-animation-delay="150ms">
        {/* Left Column: Form + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Creation Form */}
          <div style={glassCard}>
            <div style={sectionTitle}>
              <div style={iconBadge('linear-gradient(135deg, #3b82f6, #2563eb)')}>
                <Filter size={18} color="#fff" />
              </div>
              Crear nueva campaña
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>Nombre de la campaña</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Promoción Julio - Filtros de Aceite" style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>Marca del vehículo</label>
                <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Honda, Toyota, Ford" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>Modelo del vehículo</label>
                <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: Civic, Corolla, Explorer" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>Estado de venta</label>
              <select value={estadoVenta} onChange={e => setEstadoVenta(e.target.value)} style={{ width: '100%', maxWidth: 320 }}>
                <option value="">Todos los estados</option>
                <option value="Lead">Lead — Nuevo contacto</option>
                <option value="Interesado">Interesado — En negociación</option>
                <option value="No Compro">No Compró — Perdido</option>
                <option value="Compro">Compró — Cliente</option>
              </select>
            </div>

            {previewCount > 0 && (
              <div className="fade-in" style={{
                padding: '12px 16px', background: T.greenBg, borderRadius: 10, marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                border: `1px solid ${T.greenText}30`,
              }}>
                <Target size={18} style={{ color: T.greenText }} />
                <strong style={{ color: T.greenText, fontSize: 15 }}>{previewCount} destinatarios</strong>
                <span style={{ color: T.textPrimary }}>coinciden con los filtros seleccionados</span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>Mensaje de campaña</label>
              <textarea
                value={mensaje} onChange={e => setMensaje(e.target.value)} rows={5}
                placeholder='Usa {"nombre"} y {"modelo"} para personalizar. Ej: "Hola {nombre}, tenemos ofertas para tu {modelo}"'
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} />
                Variables disponibles: <code style={{ background: T.surfaceDim, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                  {'{nombre}'}
                </code>,{' '}
                <code style={{ background: T.surfaceDim, padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                  {'{modelo}'}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <button
                onClick={enviarCampania}
                disabled={sending}
                style={{
                  padding: '12px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  background: !sending ? 'var(--secondary)' : '#E5E7EB',
                  color: !sending ? '#fff' : '#9CA3AF',
                  border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: sending ? 0.7 : 1,
                  boxShadow: !sending ? '0 4px 14px rgba(189,6,10,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={18} />
                {sending ? 'Enviando...' : 'Enviar Campaña'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSecondary }}>
                <Clock size={14} />
                <span>Retardo aleatorio 45-120s entre envíos (anti-baneo)</span>
              </div>
            </div>
          </div>

          {/* Campaign History */}
          <div style={glassCard}>
            <div style={sectionTitle}>
              <div style={iconBadge('linear-gradient(135deg, #8b5cf6, #7c3aed)')}>
                <History size={18} color="#fff" />
              </div>
              Historial de Campañas
            </div>
            {campanias.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: T.textSecondary }}>
                <Send size={44} style={{ opacity: 0.1, marginBottom: 16 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: T.textPrimary }}>Aún no se han enviado campañas</p>
                <p style={{ fontSize: 13, marginTop: 6, color: T.textSecondary }}>Usa el formulario de arriba para crear tu primera campaña</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campanias.map((c, i) => {
                  const est = estadoEstilos[c.estado] || estadoEstilos.borrador;
                  const isExpanded = expandedCampana === c.id;
                  const logs = campaniaLogs[c.id] || [];
                  return (
                    <div key={c.id} style={{ borderRadius: 10, overflow: 'hidden' }}>
                      <div className="fade-in-up" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 20px',
                        border: `1px solid ${T.borderSubtle}`,
                        background: T.surfaceCard,
                        animationDelay: `${i * 60}ms`,
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? 'none' : `1px solid ${T.borderSubtle}`,
                        borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                      }}
                        onClick={() => toggleLog(c.id)}
                        onMouseEnter={e => { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.surfaceCard; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          {isExpanded ? <ChevronUp size={16} style={{ color: T.textSecondary }} /> : <ChevronDown size={16} style={{ color: T.textSecondary }} />}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary }}>{c.nombre}</div>
                            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>
                              {c.creador_nombre} · {new Date(c.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ fontSize: 14 }}>
                            <span style={{ fontWeight: 800, color: T.textPrimary }}>
                              {c.total_enviados || c.enviados}
                            </span>
                            <span style={{ color: T.textSecondary, margin: '0 2px' }}>/</span>
                            <span style={{ color: T.textSecondary }}>{c.destinatarios}</span>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 600, color: est.color, background: est.bg,
                            padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                          }}>
                            {est.label}
                          </span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{
                          border: `1px solid ${T.borderSubtle}`,
                          borderTop: 'none',
                          borderRadius: '0 0 10px 10px',
                          overflow: 'hidden',
                        }}>
                          {loadingLog ? (
                            <div style={{ padding: 20, textAlign: 'center', color: T.textSecondary, fontSize: 13 }}>Cargando historial...</div>
                          ) : logs.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: T.textSecondary, fontSize: 13 }}>
                              No hay registros de envío para esta campaña
                            </div>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: T.surfaceDim }}>
                                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: T.textSecondary }}>Cliente</th>
                                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: T.textSecondary }}>Teléfono</th>
                                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: T.textSecondary }}>Estado</th>
                                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: T.textSecondary }}>Enviado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {logs.map(log => (
                                  <tr key={log.id} style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
                                    <td style={{ padding: '10px 16px', fontWeight: 500, color: T.textPrimary }}>{log.cliente_nombre || '—'}</td>
                                    <td style={{ padding: '10px 16px', color: T.textSecondary }}>{log.telefono}</td>
                                    <td style={{ padding: '10px 16px' }}>
                                      {log.estado === 'enviado' ? (
                                        <span style={{ color: T.greenText, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <CheckCircle2 size={14} /> Enviado
                                        </span>
                                      ) : log.estado === 'error' ? (
                                        <span style={{ color: T.redText, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <XCircle size={14} /> Error
                                        </span>
                                      ) : (
                                        <span style={{ color: T.amberText }}>Pendiente</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 16px', color: T.textSecondary, fontSize: 12 }}>
                                      {log.enviado_en ? new Date(log.enviado_en).toLocaleString('es-MX') : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Phone Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={glassCard}>
            <div style={sectionTitle}>
              <div style={iconBadge('linear-gradient(135deg, #10b981, #059669)')}>
                <Smartphone size={18} color="#fff" />
              </div>
              Vista Previa
            </div>

            {/* Phone Frame */}
            <div style={{
              width: 260, height: 480, borderRadius: 36, border: '4px solid #374151',
              background: '#000', padding: 8, position: 'relative', margin: '0 auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
              {/* Notch */}
              <div style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                width: 100, height: 24, borderRadius: '0 0 16px 16px', background: '#374151',
                zIndex: 10,
              }} />

              {/* Screen */}
              <div style={{
                width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden',
                background: '#0b141a', display: 'flex', flexDirection: 'column',
              }}>
                {/* WhatsApp Header */}
                <div style={{
                  background: '#075e54', padding: '36px 14px 10px', display: 'flex',
                  alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#075e54',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #25d366, #128c7e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                    }}>R</div>
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Romicars</div>
                    <div style={{ color: '#ffffffaa', fontSize: 10 }}>en línea</div>
                  </div>
                </div>

                {/* Chat Background */}
                <div style={{
                  flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column',
                  gap: 8, overflow: 'hidden',
                  background: '#0b141a',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}>
                  {/* Date label */}
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, color: '#ffffffaa', background: 'rgba(0,0,0,0.35)',
                      padding: '3px 10px', borderRadius: 8,
                    }}>HOY</span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{ maxWidth: '85%', alignSelf: 'flex-end' }}>
                    <div style={{
                      background: '#dcf8c6', borderRadius: 8,
                      borderTopRightRadius: 0, padding: '8px 10px',
                      position: 'relative', boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
                    }}>
                      <p style={{
                        fontSize: 12, color: '#303030', lineHeight: 1.45,
                        margin: 0, wordBreak: 'break-word',
                      }}>
                        {previewMessage
                          .replace('{nombre}', 'Juan')
                          .replace('{modelo}', 'Civic')
                        }
                      </p>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: 3, marginTop: 4,
                      }}>
                        <span style={{ fontSize: 9, color: '#667781' }}>10:30</span>
                        <CheckCircle2 size={11} style={{ color: '#53bdeb' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Input Bar */}
                <div style={{
                  padding: '8px 10px', background: '#1f2c33',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    flex: 1, background: '#2a3942', borderRadius: 20,
                    padding: '7px 14px', fontSize: 11, color: '#8696a0',
                  }}>
                    Escribe un mensaje
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#25d366',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Send size={14} color="#fff" style={{ marginLeft: 2 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Info */}
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: T.surfaceDim, textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: T.textSecondary, margin: 0 }}>
                Así se verá el mensaje en el WhatsApp del cliente
              </p>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>
                Las variables se reemplazan automáticamente
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div style={glassCard}>
            <div style={sectionTitle}>
              <div style={iconBadge('linear-gradient(135deg, #f59e0b, #d97706)')}>
                <AlertCircle size={18} color="#fff" />
              </div>
              Consejos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { text: 'Usa {nombre} para personalizar cada mensaje con el nombre del cliente' },
                { text: 'Usa {modelo} para referirte al vehículo específico del cliente' },
                { text: 'El envío tiene retardo aleatorio entre 45-120s para evitar baneos' },
                { text: 'Revisa la pestaña Historial para ver el estado de cada envío individual' },
              ].map((tip, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: T.surfaceDim, fontSize: 12, color: T.textSecondary,
                  lineHeight: 1.4,
                }}>
                  <CheckCircle2 size={14} style={{ color: T.greenText, flexShrink: 0, marginTop: 1 }} />
                  {tip.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Campañas;
