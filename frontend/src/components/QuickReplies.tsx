import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Zap } from 'lucide-react';
import { snippetsApi } from '../services/api';
import type { Snippet } from '../types';

interface Props {
  onSelect: (contenido: string) => void;
  onClose: () => void;
}

export default function QuickReplies({ onSelect, onClose }: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    snippetsApi.getAll().then(setSnippets).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search) return snippets;
    const s = search.toLowerCase();
    return snippets.filter(sn =>
      sn.atajo.toLowerCase().includes(s) ||
      sn.contenido.toLowerCase().includes(s) ||
      sn.categoria.toLowerCase().includes(s)
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

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  let flatIdx = -1;

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
      background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      border: '1px solid #e0e8f0', maxHeight: 300, display: 'flex', flexDirection: 'column',
      zIndex: 50,
    }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={14} style={{ color: '#8896ab', flexShrink: 0 }} />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar respuesta rapida..."
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent',
          }}
        />
      </div>
      <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            <Zap size={20} style={{ opacity: 0.3, marginBottom: 6 }} />
            <p>No hay respuestas rapidas</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat}>
              <div style={{
                padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#8896ab',
                textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb',
              }}>
                {cat}
              </div>
              {items.map(sn => {
                flatIdx++;
                const idx = flatIdx;
                const isSelected = idx === selectedIdx;
                return (
                  <div
                    key={sn.id}
                    ref={(el) => { if (idx === selectedIdx) (el as any)?.scrollIntoView?.({ block: 'nearest' }); }}
                    onClick={() => { onSelect(sn.contenido); onClose(); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer',
                      background: isSelected ? '#f0f7ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>/{sn.atajo}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#5a6a7c', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
