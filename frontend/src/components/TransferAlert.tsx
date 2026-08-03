import { useState } from 'react';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { clientesApi } from '../services/api';
import { toast } from './Toast';
import type { Cliente } from '../types';

interface Props {
  cliente: Cliente;
  onTakeover: (cliente: Cliente) => void;
}

export default function TransferAlert({ cliente, onTakeover }: Props) {
  const [loading, setLoading] = useState(false);

  if (cliente.modo_atencion !== 'transfiriendo') return null;

  const handleTakeover = async () => {
    setLoading(true);
    try {
      const result = await clientesApi.takeover(cliente.id);
      onTakeover(result.cliente);
      toast('success', 'Chat tomado correctamente');
    } catch {
      toast('error', 'Error al tomar el chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      margin: '0 20px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      borderRadius: 10,
      border: '1px solid #F59E0B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', margin: 0 }}>
            Transferencia del Bot
          </p>
          {cliente.resumen_transferencia && (
            <p style={{ fontSize: 12, color: '#A16207', margin: '2px 0 0', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cliente.resumen_transferencia}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={handleTakeover}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: '#D97706',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          opacity: loading ? 0.7 : 1,
        }}
      >
        <UserCheck size={14} />
        {loading ? 'Tomando...' : 'Tomar este chat'}
      </button>
    </div>
  );
}
