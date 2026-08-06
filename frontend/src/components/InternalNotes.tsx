import { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, StickyNote } from 'lucide-react';
import { notasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from './Toast';
import type { NotaInterna } from '../types';

interface Props {
  clienteId: number;
  onClose: () => void;
}

export default function InternalNotes({ clienteId, onClose }: Props) {
  const { agente } = useAuth();
  const [notas, setNotas] = useState<NotaInterna[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    notasApi.getByCliente(clienteId)
      .then(setNotas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clienteId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notas.length]);

  const handleSend = async () => {
    if (!nuevaNota.trim()) return;
    try {
      const nota = await notasApi.crear({ cliente_id: clienteId, contenido: nuevaNota.trim() });
      setNotas(prev => [{ ...nota, agente_nombre: agente?.nombre || 'Agente' }, ...prev]);
      setNuevaNota('');
    } catch {
      toast('error', 'Error al guardar nota');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar esta nota?')) return;
    try {
      await notasApi.eliminar(id);
      setNotas(prev => prev.filter(n => n.id !== id));
      toast('success', 'Nota eliminada');
    } catch {
      toast('error', 'Error al eliminar nota');
    }
  };

  return (
    <div style={{
      width: 300, background: '#fff', borderLeft: '1px solid #e0e8f0',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #e0e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#FFFBEB',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <StickyNote size={16} /> Notas Internas
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', padding: 4,
        }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Cargando...</div>
        ) : notas.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <StickyNote size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No hay notas internas</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Agrega una nota para que otros agentes la vean</p>
          </div>
        ) : (
          notas.map(nota => (
            <div key={nota.id} style={{
              padding: '10px 12px', marginBottom: 8, borderRadius: 8,
              background: '#FEF3C7', border: '1px solid #FDE68A',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                  {nota.agente_nombre || 'Agente'}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#B45309' }}>
                    {new Date(nota.created_at).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                  {nota.agente_id === agente?.id && (
                    <button onClick={() => handleDelete(nota.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#B45309', padding: 2,
                    }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.4, margin: 0 }}>{nota.contenido}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 12px', borderTop: '1px solid #e0e8f0', display: 'flex', gap: 8 }}>
        <input
          value={nuevaNota}
          onChange={e => setNuevaNota(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Escribir nota..."
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 13,
            border: '1px solid #FDE68A', background: '#FFFBEB', outline: 'none',
          }}
        />
        <button onClick={handleSend} disabled={!nuevaNota.trim()} style={{
          width: 32, height: 32, borderRadius: 6, border: 'none',
          background: nuevaNota.trim() ? '#D97706' : '#e0e8f0',
          cursor: nuevaNota.trim() ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={14} style={{ color: '#fff' }} />
        </button>
      </div>
    </div>
  );
}
