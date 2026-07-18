import { useEffect, useState } from 'react';
import { Send, Filter, History, AlertCircle, Users, Target, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';
import api from '../services/api';

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

const estadoEstilos: Record<string, { color: string; bg: string; label: string }> = {
  completada: { color: '#059669', bg: '#ECFDF5', label: 'Completada' },
  enviando: { color: '#D97706', bg: '#FFFBEB', label: 'Enviando' },
  borrador: { color: '#6B7280', bg: '#F3F4F6', label: 'Borrador' },
  cancelada: { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelada' },
};

function Campañas() {
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

  useEffect(() => { api.get('/campanias').then(r => setCampanias(r.data)).catch(() => {}); }, []);

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

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div className="fade-in-up" style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gris-oscuro)', letterSpacing: '-0.03em' }}>
          Campañas de Remarketing
        </h1>
        <p style={{ color: 'var(--gris-texto)', marginTop: 4, fontSize: 14 }}>
          Segmenta y envía promociones sin pagar plantillas de Meta
        </p>
      </div>

      <div className="card fade-in-up" style={{ padding: 32, marginTop: 28, animationDelay: '100ms' }}>
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: 'var(--gris-oscuro)', marginBottom: 24,
          letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Filter size={20} style={{ color: 'var(--rojo-primario)' }} />
          Segmentar clientes
        </h3>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nombre de la campaña</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Promoción Julio - Filtros de Aceite" style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Marca del vehículo</label>
            <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Honda, Toyota, Ford" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Modelo del vehículo</label>
            <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: Civic, Corolla, Explorer" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Estado de venta</label>
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
            padding: '12px 16px', background: '#ECFDF5', borderRadius: 10, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
            border: '1px solid #A7F3D0',
          }}>
            <Target size={18} style={{ color: '#059669' }} />
            <strong style={{ color: '#059669', fontSize: 15 }}>{previewCount} destinatarios</strong>
            <span style={{ color: '#374151' }}>coinciden con los filtros seleccionados</span>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mensaje de campaña</label>
          <textarea
            value={mensaje} onChange={e => setMensaje(e.target.value)} rows={5}
            placeholder='Usa {"nombre"} y {"modelo"} para personalizar. Ej: "Hola {nombre}, tenemos ofertas para tu {modelo}"'
            style={{ width: '100%', resize: 'vertical' }}
          />
          <div style={{ fontSize: 12, color: 'var(--gris-texto)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} />
            Variables disponibles: <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
              {'{nombre}'}
            </code>,{' '}
            <code style={{ background: '#F3F4F6', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
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
              background: !sending ? 'linear-gradient(135deg, #BD060A, #9E0508)' : '#E5E7EB',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gris-texto)' }}>
            <ClockIcon />
            <span>Retardo aleatorio 45-120s entre envíos (anti-baneo)</span>
          </div>
        </div>
      </div>

      <div className="card fade-in-up" style={{ padding: 32, marginTop: 28, animationDelay: '200ms' }}>
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: 'var(--gris-oscuro)', marginBottom: 20,
          letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <History size={20} style={{ color: 'var(--azul-primario)' }} />
          Historial de Campañas
        </h3>
        {campanias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gris-texto)' }}>
            <Send size={44} style={{ opacity: 0.1, marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Aún no se han enviado campañas</p>
            <p style={{ fontSize: 13, marginTop: 6, color: '#9CA3AF' }}>Usa el formulario de arriba para crear tu primera campaña</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campanias.map((c, i) => {
              const est = estadoEstilos[c.estado] || estadoEstilos.borrador;
              return (
                <div key={c.id} className="fade-in-up" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderRadius: 10,
                  border: '1px solid var(--gris-borde)',
                  background: 'var(--blanco)',
                  animationDelay: `${i * 60}ms`,
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sombra-sm)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gris-oscuro)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--gris-texto)', marginTop: 4 }}>
                      {c.creador_nombre} · {new Date(c.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 14 }}>
                      <span style={{ fontWeight: 800, color: 'var(--gris-oscuro)' }}>
                        {c.total_enviados || c.enviados}
                      </span>
                      <span style={{ color: 'var(--gris-texto)', margin: '0 2px' }}>/</span>
                      <span style={{ color: 'var(--gris-texto)' }}>{c.destinatarios}</span>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: est.color, background: est.bg,
                      padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      {est.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default Campañas;
