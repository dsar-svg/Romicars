import { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, StickyNote } from 'lucide-react';
import { notasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
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
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
      width: 320, background: '#fff', borderLeft: '1px solid #e5e7eb',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        padding: '16px 18px', borderBottom: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Hanken Grotesk', sans-serif" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StickyNote size={14} color="#fff" />
          </div>
          Notas Internas
        </span>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 6, border: 'none',
          background: 'rgba(146,64,14,0.1)', cursor: 'pointer', color: '#92400E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Cargando...</div>
        ) : notas.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <StickyNote size={22} color="#D97706" />
            </div>
            <p style={{ fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Sin notas aun</p>
            <p style={{ fontSize: 11, color: '#9ca3af' }}>Agrega una nota para que otros agentes la vean</p>
          </div>
        ) : (
          notas.map(nota => (
            <div key={nota.id} style={{
              padding: '12px 14px', marginBottom: 10, borderRadius: 10,
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              border: '1px solid #FDE68A',
              boxShadow: '0 1px 3px rgba(245,158,11,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#D97706',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#fff',
                  }}>
                    {(nota.agente_nombre || 'A').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                    {nota.agente_nombre || 'Agente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#B45309', opacity: 0.7 }}>
                    {new Date(nota.created_at).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                  {nota.agente_id === agente?.id && (
                    <button onClick={() => setConfirmDelete(nota.id)} style={{
                      width: 20, height: 20, borderRadius: 4, border: 'none',
                      background: 'transparent', cursor: 'pointer', color: '#B45309',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.5, transition: 'opacity 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.45, margin: 0 }}>{nota.contenido}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={nuevaNota}
            onChange={e => setNuevaNota(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Escribir nota interna..."
            rows={2}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 13,
              border: '1px solid #e5e7eb', background: '#f9fafb', outline: 'none',
              resize: 'none', fontFamily: "'Inter', sans-serif",
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#F59E0B'}
            onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <button onClick={handleSend} disabled={!nuevaNota.trim()} style={{
            width: 36, height: 36, borderRadius: 8, border: 'none', alignSelf: 'flex-end',
            background: nuevaNota.trim() ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#e5e7eb',
            cursor: nuevaNota.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: nuevaNota.trim() ? '0 2px 6px rgba(245,158,11,0.3)' : 'none',
            transition: 'all 0.15s',
          }}>
            <Send size={14} style={{ color: '#fff' }} />
          </button>
        </div>
      </div>

      {confirmDelete !== null && (
        <ConfirmDialog
          titulo="Eliminar nota"
          mensaje="Esta nota se eliminara permanentemente."
          tipo="peligro"
          onConfirmar={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancelar={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
