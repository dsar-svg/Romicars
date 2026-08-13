import { useState, useEffect, FormEvent } from 'react';
import {
  Settings, HelpCircle, MessageCirclePlus, Plus, Trash2, Pencil, X,
  ToggleLeft, ToggleRight, Tag, User, Search,
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';
import type { Faq, AdminSnippet } from '../types';

type Tab = 'faqs' | 'snippets';

export default function AdminConfig() {
  const t = useTheme();
  const [tab, setTab] = useState<Tab>('faqs');
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [snippets, setSnippets] = useState<AdminSnippet[]>([]);
  const [agentesList, setAgentesList] = useState<{ id: number; nombre: string }[]>([]);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // FAQ form
  const [faqCategoria, setFaqCategoria] = useState('');
  const [faqPregunta, setFaqPregunta] = useState('');
  const [faqRespuesta, setFaqRespuesta] = useState('');

  // Snippet form
  const [snAgenteId, setSnAgenteId] = useState<number | null>(null);
  const [snAtajo, setSnAtajo] = useState('');
  const [snContenido, setSnContenido] = useState('');
  const [snCategoria, setSnCategoria] = useState('general');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFaqs = async () => {
    try { const r = await api.get('/faqs'); setFaqs(r.data); } catch { setError('Error al cargar FAQs'); }
  };

  const fetchSnippets = async () => {
    try {
      const [s, a] = await Promise.all([
        api.get('/admin/snippets'),
        api.get('/admin/snippets/agentes'),
      ]);
      setSnippets(s.data);
      setAgentesList(a.data);
    } catch { setError('Error al cargar snippets'); }
  };

  useEffect(() => { fetchFaqs(); fetchSnippets(); }, []);

  // ──── FAQs ────
  const saveFaq = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editId) {
        await api.put(`/faqs/${editId}`, { categoria: faqCategoria, pregunta: faqPregunta, respuesta: faqRespuesta });
      } else {
        await api.post('/faqs', { categoria: faqCategoria, pregunta: faqPregunta, respuesta: faqRespuesta });
      }
      resetFaqForm(); fetchFaqs();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al guardar FAQ'); }
    finally { setLoading(false); }
  };

  const toggleFaqActivo = async (faq: Faq) => {
    try { await api.put(`/faqs/${faq.id}`, { activo: !faq.activo }); fetchFaqs(); } catch { setError('Error'); }
  };

  const deleteFaq = async (id: number) => {
    if (!confirm('¿Eliminar esta FAQ?')) return;
    try { await api.delete(`/faqs/${id}`); fetchFaqs(); } catch { setError('Error al eliminar'); }
  };

  const editFaq = (faq: Faq) => {
    setEditId(faq.id); setFaqCategoria(faq.categoria || ''); setFaqPregunta(faq.pregunta); setFaqRespuesta(faq.respuesta);
    setShowForm(true);
  };

  const resetFaqForm = () => { setEditId(null); setFaqCategoria(''); setFaqPregunta(''); setFaqRespuesta(''); setShowForm(false); };

  // ──── Snippets ────
  const saveSnippet = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (editId) {
        await api.put(`/admin/snippets/${editId}`, { agente_id: snAgenteId, atajo: snAtajo, contenido: snContenido, categoria: snCategoria });
      } else {
        await api.post('/admin/snippets', { agente_id: snAgenteId, atajo: snAtajo, contenido: snContenido, categoria: snCategoria });
      }
      resetSnForm(); fetchSnippets();
    } catch (err: any) { setError(err.response?.data?.error || 'Error al guardar snippet'); }
    finally { setLoading(false); }
  };

  const deleteSnippet = async (id: number) => {
    if (!confirm('¿Eliminar este snippet?')) return;
    try { await api.delete(`/admin/snippets/${id}`); fetchSnippets(); } catch { setError('Error al eliminar'); }
  };

  const editSnippet = (sn: AdminSnippet) => {
    setEditId(sn.id); setSnAgenteId(sn.agente_id); setSnAtajo(sn.atajo); setSnContenido(sn.contenido); setSnCategoria(sn.categoria);
    setShowForm(true);
  };

  const resetSnForm = () => { setEditId(null); setSnAgenteId(null); setSnAtajo(''); setSnContenido(''); setSnCategoria('general'); setShowForm(false); };

  const faqsFiltradas = faqs.filter(f =>
    !search || f.pregunta.toLowerCase().includes(search.toLowerCase()) || f.respuesta.toLowerCase().includes(search.toLowerCase()) || (f.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  const snippetsFiltrados = snippets.filter(s =>
    !search || s.atajo.toLowerCase().includes(search.toLowerCase()) || s.contenido.toLowerCase().includes(search.toLowerCase()) || (s.agente_nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const faqCategorias = [...new Set(faqs.map(f => f.categoria).filter((c): c is string => Boolean(c)))];
  const snCategorias = [...new Set(snippets.map(s => s.categoria).filter(Boolean))];

  const glassBg = t.dark ? 'rgba(13,26,46,0.6)' : 'rgba(255,255,255,0.7)';
  const glassBorder = t.dark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.08)';

  const iconBadge = (gradient: string, _Icon?: any) => ({
    width: 36, height: 36, borderRadius: 10,
    background: gradient,
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    boxShadow: `0 4px 12px ${gradient.match(/#[a-f0-9]+/i)?.[0] || '#000'}33`,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    background: t.dark ? 'rgba(17,31,56,0.8)' : '#f7f8fa',
    border: `1px solid ${t.dark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.1)'}`,
    color: t.textPrimary, outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={iconBadge('linear-gradient(135deg, #f59e0b, #d97706)', Settings)}>
          <Settings size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.textPrimary, fontFamily: "'Hanken Grotesk', sans-serif" }}>
            Configuración
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
            Gestiona FAQs y respuestas rápidas del sistema
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: t.redBg, border: `1px solid ${t.redText}33`, borderRadius: 10, marginBottom: 20, color: t.redText, fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: t.subtleBg, borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {([
          { key: 'faqs' as Tab, label: 'Preguntas Frecuentes', icon: HelpCircle, count: faqs.length },
          { key: 'snippets' as Tab, label: 'Respuestas Rápidas', icon: MessageCirclePlus, count: snippets.length },
        ]).map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setShowForm(false); setEditId(null); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === tb.key ? (t.dark ? '#1e3a5f' : '#fff') : 'transparent',
              color: tab === tb.key ? t.textPrimary : t.textMuted,
              boxShadow: tab === tb.key ? t.shadowCard : 'none',
            }}
          >
            <tb.icon size={16} />
            {tb.label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              background: tab === tb.key ? 'var(--primary)' : t.subtleBg,
              color: tab === tb.key ? '#fff' : t.textMuted,
            }}>{tb.count}</span>
          </button>
        ))}
      </div>

      {/* Search + New */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.textMuted }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'faqs' ? 'Buscar por categoría, pregunta o respuesta...' : 'Buscar por atajo, contenido o agente...'}
            style={{ ...inputStyle, paddingLeft: 38 }}
          />
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); resetFaqForm(); resetSnForm(); }}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: showForm ? t.subtleBg : 'var(--primary)',
            color: showForm ? t.textPrimary : '#fff',
            border: showForm ? `1px solid ${glassBorder}` : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}
        >
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          padding: 24, marginBottom: 24,
          background: glassBg, backdropFilter: 'blur(16px)',
          border: `1px solid ${glassBorder}`, borderRadius: 16, boxShadow: t.shadowCard,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={iconBadge('linear-gradient(135deg, #3b82f6, #2563eb)', editId ? Pencil : Plus)}>
              {editId ? <Pencil size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}>
              {editId ? 'Editar' : 'Nueva'} {tab === 'faqs' ? 'FAQ' : 'Respuesta Rápida'}
            </span>
          </div>

          {tab === 'faqs' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Tag size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Categoría
                  </label>
                  <input value={faqCategoria || ''} onChange={e => setFaqCategoria(e.target.value)} placeholder="ej: Envíos, Pagos, Productos..." style={inputStyle} list="faq-cats" />
                  <datalist id="faq-cats">{faqCategorias.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <HelpCircle size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pregunta
                  </label>
                  <input value={faqPregunta} onChange={e => setFaqPregunta(e.target.value)} placeholder="¿Cómo puedo...?" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Respuesta
                  </label>
                  <textarea value={faqRespuesta} onChange={e => setFaqRespuesta(e.target.value)} placeholder="Respuesta completa..." required rows={3}
                    style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 80 }} />
                </div>
              </div>
              <button type="button" onClick={saveFaq} disabled={loading}
                style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Guardando...' : editId ? 'Actualizar FAQ' : 'Crear FAQ'}
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <User size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Agente (opcional)
                  </label>
                  <select value={snAgenteId ?? ''} onChange={e => setSnAgenteId(e.target.value ? Number(e.target.value) : null)} style={inputStyle}>
                    <option value="">Todos los agentes</option>
                    {agentesList.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Tag size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Categoría
                  </label>
                  <input value={snCategoria} onChange={e => setSnCategoria(e.target.value)} placeholder="ej: saludos, precios, envíos" style={inputStyle} list="sn-cats" />
                  <datalist id="sn-cats">{snCategorias.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Atajo (abreviatura)
                  </label>
                  <input value={snAtajo} onChange={e => setSnAtajo(e.target.value)} placeholder="ej: /saludo, /precio" required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contenido
                  </label>
                  <textarea value={snContenido} onChange={e => setSnContenido(e.target.value)} placeholder="Texto que se enviará..." required rows={2}
                    style={{ ...inputStyle, resize: 'vertical' as const, minHeight: 60 }} />
                </div>
              </div>
              <button type="button" onClick={saveSnippet} disabled={loading}
                style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Guardando...' : editId ? 'Actualizar Snippet' : 'Crear Snippet'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: glassBg, backdropFilter: 'blur(16px)',
        border: `1px solid ${glassBorder}`, borderRadius: 16, boxShadow: t.shadowCard,
        overflow: 'hidden',
      }}>
        {tab === 'faqs' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 2.5fr 80px 100px', padding: '14px 20px', borderBottom: `1px solid ${glassBorder}`, background: t.subtleBg }}>
              {['Categoría', 'Pregunta', 'Respuesta', 'Estado', 'Acciones'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            {faqsFiltradas.map((f, i) => (
              <div key={f.id} style={{
                display: 'grid', gridTemplateColumns: '100px 1.5fr 2.5fr 80px 100px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < faqsFiltradas.length - 1 ? `1px solid ${t.borderSubtle}` : 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.categoria || '—'}
                </span>
                <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.pregunta}
                </span>
                <span style={{ color: t.textSecondary, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.respuesta}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => toggleFaqActivo(f)}>
                  {f.activo
                    ? <ToggleRight size={20} color="#22C55E" />
                    : <ToggleLeft size={20} color={t.textMuted} />}
                  <span style={{ fontSize: 12, color: f.activo ? t.greenText : t.textMuted }}>{f.activo ? 'Activa' : 'Inactiva'}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => editFaq(f)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${glassBorder}`, background: 'transparent', cursor: 'pointer', color: t.textSecondary }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteFaq(f.id)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.redText}33`, background: 'transparent', cursor: 'pointer', color: t.redText }}
                    onMouseEnter={e => e.currentTarget.style.background = t.redBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {faqsFiltradas.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <HelpCircle size={40} style={{ color: t.textMuted, opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary }}>
                  {search ? 'Sin resultados' : 'No hay FAQs registradas'}
                </p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                  {search ? 'Intenta con otros términos' : 'Crea la primera FAQ con el botón de arriba'}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 120px 1.5fr 2fr 80px', padding: '14px 20px', borderBottom: `1px solid ${glassBorder}`, background: t.subtleBg }}>
              {['Agente', 'Atajo', 'Contenido', 'Categoría', 'Acciones'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>
            {snippetsFiltrados.map((s, i) => (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: '100px 120px 1.5fr 2fr 80px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < snippetsFiltrados.length - 1 ? `1px solid ${t.borderSubtle}` : 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 12, color: t.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.agente_nombre || 'Todos'}
                </span>
                <span style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary, fontFamily: 'monospace' }}>
                  {s.atajo}
                </span>
                <span style={{ fontSize: 12, color: t.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.contenido}
                </span>
                <span style={{ fontSize: 12, color: t.textMuted }}>
                  {s.categoria}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => editSnippet(s)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${glassBorder}`, background: 'transparent', cursor: 'pointer', color: t.textSecondary }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteSnippet(s.id)} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.redText}33`, background: 'transparent', cursor: 'pointer', color: t.redText }}
                    onMouseEnter={e => e.currentTarget.style.background = t.redBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {snippetsFiltrados.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <MessageCirclePlus size={40} style={{ color: t.textMuted, opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary }}>
                  {search ? 'Sin resultados' : 'No hay respuestas rápidas registradas'}
                </p>
                <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
                  {search ? 'Intenta con otros términos' : 'Crea la primera con el botón de arriba'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
