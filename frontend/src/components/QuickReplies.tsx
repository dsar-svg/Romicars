import { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, Command } from 'lucide-react';
import { snippetsApi } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { toast } from './Toast';
import type { Snippet } from '../types';

interface Props {
  onSelect: (contenido: string) => void;
  onClose: () => void;
}

export default function QuickReplies({ onSelect, onClose }: Props) {
  const t = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    snippetsApi.getAll().then(setSnippets).catch(() => toast('error', 'Error al cargar respuestas'));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!search) return snippets;
    const s = search.toLowerCase();
    return snippets.filter(sn =>
      (sn.atajo || '').toLowerCase().includes(s) ||
      (sn.contenido || '').toLowerCase().includes(s) ||
      (sn.categoria || '').toLowerCase().includes(s)
    );
  }, [snippets, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Snippet[]>();
    filtered.forEach(sn => {
      const cat = sn.categoria || 'general';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(sn);
    });
    return map;
  }, [filtered]);

  useEffect(() => { setSelectedIdx(0); }, [search]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && filtered[selectedIdx]) { e.preventDefault(); onSelect(filtered[selectedIdx].contenido); onClose(); }
      else if (e.key === 'Escape') { onClose(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [filtered, selectedIdx, onSelect, onClose]);

  const flatIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let idx = 0;
    for (const items of grouped.values()) {
      for (const sn of items) {
        map.set(sn.id, idx++);
      }
    }
    return map;
  }, [grouped]);

  const catColors: Record<string, string> = {
    general: '#6B7280',
    saludos: '#059669',
    ventas: '#2563EB',
    soporte: '#7C3AED',
    precios: '#D97706',
  };

  return (
    <div ref={panelRef} style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
      background: t.surfaceCard, borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      border: '1px solid #e5e7eb', maxHeight: 320, display: 'flex', flexDirection: 'column',
      zIndex: 50, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#f9fafb',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: '#EEF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Command size={13} color="#4F46E5" />
        </div>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar respuesta rapida..."
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
            fontFamily: "'Inter', sans-serif",
          }}
        />
        <span style={{
          fontSize: 10, color: '#9ca3af', padding: '2px 6px', borderRadius: 4,
          background: '#f3f4f6', fontFamily: 'monospace',
        }}>
          ESC
        </span>
      </div>

      <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Zap size={18} color="#9ca3af" />
            </div>
            <p style={{ fontWeight: 600, color: '#6b7280', marginBottom: 2 }}>Sin resultados</p>
            <p style={{ fontSize: 11 }}>Intenta con otro termino</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat}>
              <div style={{
                padding: '6px 14px', fontSize: 10, fontWeight: 700, color: catColors[cat] || '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f9fafb',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: catColors[cat] || '#6B7280',
                }} />
                {cat}
              </div>
              {items.map(sn => {
                const idx = flatIndexMap.get(sn.id) ?? 0;
                const isSelected = idx === selectedIdx;
                return (
                  <div
                    key={sn.id}
                    onClick={() => { onSelect(sn.contenido); onClose(); }}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      background: isSelected ? '#EEF2FF' : 'transparent',
                      borderLeft: isSelected ? '3px solid #4F46E5' : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#4F46E5',
                        background: '#EEF2FF', padding: '1px 6px', borderRadius: 4,
                        fontFamily: 'monospace',
                      }}>
                        /{sn.atajo}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: '#4b5563', lineHeight: 1.35,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {sn.contenido}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
