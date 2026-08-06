import { useState, useEffect } from 'react';
import { X, Phone, Car, ShoppingCart, Bell, FileText, History, Save } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { connectSocket } from '../services/socket';
import { toast } from './Toast';
import { useTheme } from '../hooks/useTheme';
import type { Cliente, Mensaje } from '../types';

interface Props {
  cliente: Cliente;
  onClose?: () => void;
}

export default function ClientPanel({ cliente: initial, onClose }: Props) {
  const t = useTheme();
  const [cliente, setCliente] = useState<Cliente>(initial);
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<Mensaje[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setCliente(initial);
    setDirty(false);
    mensajesApi.getByCliente(initial.id).then(setHistorial).catch(() => {});
    const socket = connectSocket();
    const handler = (mensaje: Mensaje) => {
      if (mensaje.cliente_id === initial.id) {
        setHistorial(prev => [...prev, mensaje]);
      }
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [initial.id]);

  const campos = [
    { label: 'Nombre completo', key: 'nombre', type: 'text', icon: null },
    { label: 'Teléfono', key: 'telefono', type: 'text', icon: Phone },
    { label: 'Marca del vehículo', key: 'marca_carro', type: 'text', icon: Car },
    { label: 'Modelo del vehículo', key: 'modelo_carro', type: 'text', icon: Car },
    { label: 'Año', key: 'anio_carro', type: 'number', icon: null },
    { label: 'Motor', key: 'motor_carro', type: 'text', icon: null },
  ] as const;

  const handleChange = (key: string, value: string | number | boolean) => {
    setCliente(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const updated = await clientesApi.update(cliente.id, {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        marca_carro: cliente.marca_carro,
        modelo_carro: cliente.modelo_carro,
        anio_carro: cliente.anio_carro,
        motor_carro: cliente.motor_carro,
        estado_venta: cliente.estado_venta,
        urgencia: cliente.urgencia,
        acepta_promos: cliente.acepta_promos,
        resumen_busqueda: cliente.resumen_busqueda,
        pidio_fotos: cliente.pidio_fotos,
      });
      setCliente(updated);
      setDirty(false);
      toast('success', 'Cliente actualizado');
    } catch {
      toast('error', 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="slide-in-right" style={{
      width: 340, background: 'var(--surface-card)', borderLeft: '1px solid var(--outline)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
    }}>
      <div style={{
        padding: '16px 16px', borderBottom: '1px solid var(--outline)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: t.surfaceDim,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} /> Ficha del Cliente
        </span>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
            padding: 4, borderRadius: 6, transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
                    background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(1,41,128,0.2)',
          }}>
            {(cliente.nombre || cliente.telefono || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {cliente.nombre || 'Sin nombre'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Phone size={12} /> {cliente.telefono}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
          {campos.map(({ label, key, type, icon: Icon }) => (
            <div key={key}>
              <label style={{
                display: 'flex', marginBottom: 4, color: 'var(--text-secondary)', fontSize: 12,
                fontWeight: 500, alignItems: 'center', gap: 4,
              }}>
                {Icon && <Icon size={13} />} {label}
              </label>
              <input
                type={type}
                value={String((cliente as any)[key] || '')}
                onChange={e => handleChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
              />
            </div>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
            <ShoppingCart size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Estado de Venta
          </label>
          <select
            value={cliente.estado_venta}
            onChange={e => { handleChange('estado_venta', e.target.value); }}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
          >
            <option value="Lead">Lead — Nuevo contacto</option>
            <option value="Interesado">Interesado — En negociación</option>
            <option value="Compro">Compró — Cliente</option>
            <option value="No Compro">No Compró — Perdido</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
            <Bell size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Urgencia
          </label>
          <select
            value={cliente.urgencia}
            onChange={e => handleChange('urgencia', e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
          >
            <option value="Baja">Baja — Sin prisa</option>
            <option value="Media">Media — Consulta normal</option>
            <option value="Alta">Alta — Urgente</option>
          </select>
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer',
          padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline)',
          transition: 'border-color 0.2s, background 0.2s',
          background: cliente.acepta_promos ? t.greenBg : t.bgCard,
          borderColor: cliente.acepta_promos ? '#6EE7B7' : 'var(--outline)',
        }}>
          <input
            type="checkbox"
            checked={cliente.acepta_promos}
            onChange={e => handleChange('acepta_promos', e.target.checked)}
            style={{ accentColor: '#059669', width: 16, height: 16 }}
          />
          <span style={{ fontWeight: 500 }}>
            {cliente.acepta_promos ? 'Acepta promociones' : 'No acepta promociones'}
          </span>
        </label>

        {cliente.resumen_busqueda && (
          <div style={{
            padding: '12px 14px', background: t.blueBg, borderRadius: 10, fontSize: 13,
            border: '1px solid var(--outline)', borderLeft: '3px solid var(--primary)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
              <FileText size={14} /> Resumen IA
            </div>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{cliente.resumen_busqueda}</p>
            {cliente.pidio_fotos !== undefined && (
              <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {cliente.pidio_fotos ? '📸 Solicitó fotos' : '❌ No solicitó fotos'}
              </p>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
            <History size={14} /> Historial ({historial.length})
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {historial.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                Sin historial de mensajes
              </p>
            ) : (
              historial.slice(-20).reverse().map((msg, i) => (
                <div key={msg.id} className="fade-in" style={{
                  padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                  background: msg.remitente === 'agente' ? t.redBg : msg.remitente === 'bot' ? t.subtleBg : t.bgCard,
                  border: '1px solid var(--outline)',
                  animationDelay: `${i * 30}ms`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>
                      {msg.remitente === 'agente' ? 'Tú' : msg.remitente === 'bot' ? 'Bot IA' : 'Cliente'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, lineHeight: 1.4 }}>{msg.contenido}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={saving || !dirty}
          className="btn-primary"
          style={{
            width: '100%', padding: 12, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: saving || !dirty ? 0.6 : 1,
            cursor: saving || !dirty ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? (
            <>Guardando...</>
          ) : (
            <><Save size={16} /> {dirty ? 'Guardar Cambios' : 'Guardado'}</>
          )}
        </button>
      </div>
    </div>
  );
}
