import { useEffect, useState } from 'react';
import { Send, Filter, History, AlertCircle, Users } from 'lucide-react';
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
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--gris-oscuro)' }}>Campañas de Remarketing</h1>
        <p style={{ color: 'var(--gris-texto)', marginTop: 4 }}>
          Segmenta y envía promociones sin pagar plantillas de Meta
        </p>
      </div>

      <div className="card fade-in" style={{ padding: 28, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} style={{ color: 'var(--rojo-primario)' }} />
          Segmentar clientes
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>Nombre de campaña</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Promoción Julio - Filtros" style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>Marca del vehículo</label>
            <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Honda" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>Modelo del vehículo</label>
            <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: Civic" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>Estado de venta</label>
          <select value={estadoVenta} onChange={e => setEstadoVenta(e.target.value)} style={{ width: '100%', maxWidth: 300 }}>
            <option value="">Todos los estados</option>
            <option value="Lead">Lead</option>
            <option value="Interesado">Interesado</option>
            <option value="No Compro">No Compró</option>
            <option value="Compro">Compró</option>
          </select>
        </div>

        {previewCount > 0 && (
          <div style={{ padding: '10px 14px', background: '#E8F5E9', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Users size={16} style={{ color: '#2E7D32' }} />
            <strong style={{ color: '#2E7D32' }}>{previewCount} destinatarios</strong>
            <span style={{ color: '#555' }}>coinciden con los filtros seleccionados</span>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>Mensaje de campaña</label>
          <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={5}
            placeholder='Escribe tu mensaje. Usa {nombre} y {modelo} para personalizar. Ej: "Hola {nombre}, tenemos ofertas para tu {modelo}"'
            style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={enviarCampania} disabled={sending} className="btn-primary"
            style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
            <Send size={18} />
            {sending ? 'Enviando...' : 'Enviar Campaña'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gris-texto)' }}>
            <AlertCircle size={14} />
            <span>Retardo aleatorio 45-120s entre envíos (anti-baneo)</span>
          </div>
        </div>
      </div>

      <div className="card fade-in" style={{ padding: 28, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} style={{ color: 'var(--azul-primario)' }} />
          Historial de Campañas
        </h3>
        {campanias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gris-texto)' }}>
            <Send size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>Aún no se han enviado campañas</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Usa el formulario de arriba para crear tu primera campaña</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {campanias.map(c => (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 8, border: '1px solid var(--gris-borde)',
                background: 'var(--blanco)',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-texto)', marginTop: 2 }}>
                    {c.creador_nombre} &middot; {new Date(c.created_at).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{c.total_enviados || c.enviados}/{c.destinatarios}</div>
                  <div style={{ fontSize: 12, color: c.estado === 'completada' ? '#2E7D32' : c.estado === 'enviando' ? '#F9A825' : 'var(--gris-texto)' }}>
                    {c.estado}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Campañas;
