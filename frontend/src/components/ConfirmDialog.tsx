import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface Props {
  titulo: string;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  tipo?: 'peligro' | 'info' | 'advertencia';
  textoConfirmar?: string;
  textoCancelar?: string;
}

export default function ConfirmDialog({
  titulo, mensaje, onConfirmar, onCancelar,
  tipo = 'peligro', textoConfirmar = 'Aceptar', textoCancelar = 'Cancelar',
}: Props) {
  const t = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelar(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancelar]);

  const colores = {
    peligro: { accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: <Trash2 size={22} color="#DC2626" /> },
    advertencia: { accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: <AlertTriangle size={22} color="#D97706" /> },
    info: { accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: <Info size={22} color="#2563EB" /> },
  };
  const c = colores[tipo];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, backdropFilter: 'blur(2px)',
    }} onClick={onCancelar}>
      <div ref={dialogRef} onClick={e => e.stopPropagation()} style={{
        background: t.surfaceCard, borderRadius: 16, padding: 0,
        width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'confirmSlideIn 0.2s ease-out',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes confirmSlideIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: c.bg, border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', margin: 0, fontFamily: "'Hanken Grotesk', sans-serif" }}>
              {titulo}
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.4 }}>
              {mensaje}
            </p>
          </div>
        </div>
        <div style={{
          padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end',
          borderTop: '1px solid #f3f4f6', marginTop: 20,
        }}>
          <button onClick={onCancelar} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: '1px solid var(--outline)', background: t.surfaceCard, color: t.textPrimary,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = t.surfaceCard}
          >
            {textoCancelar}
          </button>
          <button onClick={onConfirmar} style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: 'none', background: c.accent, color: '#fff',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
