import { useState, useEffect } from 'react';
import { X, Phone, Car, ShoppingCart, Bell, FileText, History } from 'lucide-react';
import { clientesApi, mensajesApi } from '../services/api';
import { toast } from './Toast';
import type { Cliente, Mensaje } from '../types';

interface Props {
  cliente: Cliente;
  onClose: () => void;
}

export default function ClientPanel({ cliente: initial, onClose }: Props) {
  const [cliente, setCliente] = useState<Cliente>(initial);
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<Mensaje[]>([]);

  useEffect(() => {
    setCliente(initial);
    mensajesApi.getByCliente(initial.id).then(setHistorial).catch(() => {});
  }, [initial.id]);

  const campos = [
    { label: 'Nombre', key: 'nombre', type: 'text' },
    { label: 'Teléfono', key: 'telefono', type: 'text' },
    { label: 'Marca', key: 'marca_carro', type: 'text' },
    { label: 'Modelo', key: 'modelo_carro', type: 'text' },
    { label: 'Año', key: 'anio_carro', type: 'number' },
    { label: 'Motor', key: 'motor_carro', type: 'text' },
  ] as const;

  const handleChange = (key: string, value: string | number | boolean) => {
    setCliente(prev => ({ ...prev, [key]: value }));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const updated = await clientesApi.update(cliente.id, {
        nombre: cliente.nombre,
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
      toast('success', 'Cliente actualizado');
    } catch {
      toast('error', 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      width: 320, background: 'var(--blanco)', borderLeft: '1px solid var(--gris-borde)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--gris-borde)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--gris-fondo)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gris-oscuro)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={16} /> Ficha del Cliente
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gris-texto)', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--azul-primario), var(--azul-oscuro))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(cliente.nombre || cliente.telefono).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{cliente.nombre || 'Sin nombre'}</div>
            <div style={{ fontSize: 12, color: 'var(--gris-texto)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Phone size={12} /> {cliente.telefono}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          {campos.map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: 2, color: 'var(--gris-texto)', fontSize: 12 }}>{label}</label>
              <input
                type={type}
                value={String((cliente as any)[key] || '')}
                onChange={e => handleChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
              />
            </div>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 2, color: 'var(--gris-texto)', fontSize: 12 }}>
            <ShoppingCart size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Estado de Venta
          </label>
          <select
            value={cliente.estado_venta}
            onChange={e => handleChange('estado_venta', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
          >
            <option value="Lead">Lead</option>
            <option value="Interesado">Interesado</option>
            <option value="Compro">Compró</option>
            <option value="No Compro">No Compró</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 2, color: 'var(--gris-texto)', fontSize: 12 }}>
            <Bell size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Urgencia
          </label>
          <select
            value={cliente.urgencia}
            onChange={e => handleChange('urgencia', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', fontSize: 13 }}
          >
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={cliente.acepta_promos}
            onChange={e => handleChange('acepta_promos', e.target.checked)}
          />
          Acepta Promociones
        </label>

        {cliente.resumen_busqueda && (
          <div style={{ padding: '10px 12px', background: 'var(--azul-claro)', borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--azul-primario)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={14} /> Resumen IA
            </div>
            <p>{cliente.resumen_busqueda}</p>
            {cliente.pidio_fotos !== undefined && (
              <p style={{ marginTop: 4, fontSize: 12, color: 'var(--gris-texto)' }}>
                {cliente.pidio_fotos ? 'Solicitó fotos' : 'No solicitó fotos'}
              </p>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gris-oscuro)' }}>
            <History size={14} /> Historial ({historial.length})
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
            {historial.slice(-20).reverse().map(msg => (
              <div key={msg.id} style={{
                padding: '6px 8px', marginBottom: 4, borderRadius: 6,
                background: msg.remitente === 'agente' ? 'var(--rojo-claro)' : msg.remitente === 'bot' ? 'var(--gris-fondo)' : 'var(--blanco)',
                border: '1px solid var(--gris-borde)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--gris-texto)' }}>
                    {msg.remitente === 'agente' ? 'Tú' : msg.remitente === 'bot' ? 'Bot' : 'Cliente'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gris-texto)' }}>
                    {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: 'var(--gris-oscuro)' }}>{msg.contenido}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%', padding: 10, fontSize: 13, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
