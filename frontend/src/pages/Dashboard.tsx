import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, MessageCircle, DollarSign,
  BarChart3, PieChart, Package, MapPin,
  ArrowUp, ArrowDown, ShoppingCart, UserPlus, Clock,
  AlertTriangle, CheckCircle, Headphones, Brain,
  Zap, Target, Timer, Star, Eye,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import api from '../services/api';
import VenezuelaMap from '../components/VenezuelaMap';

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

interface AnalyticsData {
  total_leads: number;
  chats_activos: number;
  tasa_conversion: number;
  funnel: { etapa: string; valor: number; color: string }[];
  traffic: { canal: string; total: number; color: string }[];
  leads: {
    nuevos_hoy: number;
    pendientes_respuesta: number;
    por_urgencia: { Alta: number; Media: number; Baja: number };
    por_asignacion: { asignados: number; sin_asignar: number };
    por_estado: { nuevo: number; en_progreso: number; resuelto: number; cerrado: number; en_pausa: number };
  };
}

interface TendenciaData { tendencias: { fecha: string; leads: number; ventas: number }[]; }
interface RespuestaData {
  promedio_general_segundos: number;
  por_canal: { canal: string; promedio_segundos: number; total_conversaciones: number }[];
  total_conversaciones: number;
  respuestas_rapidas: number;
  respuestas_lentas: number;
}
interface AgenteData { id: number; nombre: string; chats_asignados: number; ventas_cerradas: number; no_ventas: number; tasa_conversion: number; tiempo_respuesta_promedio: number; }
interface DemandaData {
  busquedas_populares: { termino: string; total: number }[];
  marcas_populares: { marca: string; total: number }[];
  motores_populares: { motor: string; total: number }[];
  busquedas_sin_venta: number;
  total_con_busqueda: number;
}
interface InsightData { tipo: string; titulo: string; descripcion: string; prioridad: string; accion: string; }
interface ProfitData {
  productos_mas_vendidos: { co_art: string; art_des: string; total_vendido: number; cantidad_vendida: number; existencias: number }[];
  productos_menos_vendidos: { co_art: string; art_des: string; total_vendido: number; cantidad_vendida: number; existencias: number }[];
  total_facturado: number;
  facturas_periodo: number;
  clientes_ubicacion: { co_cli: string; cli_des: string; lat: number; lng: number; ciudad: string; estado: string }[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}
function formatNumber(n: number): string { return new Intl.NumberFormat('es-VE').format(n); }
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${Math.round(seconds / 3600)}h`;
}

const BRAND_DARK = {
  primaryDark: '#1A365D',
  primaryMed: '#2B6CB0',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  secondary: '#EF4444',
  secondaryDark: '#B51822',
  bgPage: 'linear-gradient(135deg, #0d1a2e 0%, #142440 50%, #0d1a2e 100%)',
  bgCard: 'rgba(26, 54, 93, 0.45)',
  borderCard: 'rgba(59, 130, 246, 0.12)',
  shadowCard: '0 4px 24px rgba(13, 26, 46, 0.6)',
  textPrimary: '#eaf1ff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  hoverBg: 'rgba(59,130,246,0.1)',
  hoverBorder: 'rgba(59,130,246,0.15)',
  subtleBg: 'rgba(59,130,246,0.05)',
  subtleBorder: 'rgba(59,130,246,0.08)',
  rowBg: 'rgba(59,130,246,0.03)',
  gridStroke: 'rgba(59,130,246,0.1)',
  tooltipBg: '#142440',
  tooltipBorder: 'rgba(59,130,246,0.2)',
  loaderBg: 'rgba(26, 54, 93, 0.35)',
  tagBg: 'rgba(96,165,250,0.1)',
  tagBorder: 'rgba(96,165,250,0.2)',
  tagText: '#93c5fd',
  greenLight: '#34d399',
  amberLight: '#fbbf24',
};

const BRAND_LIGHT = {
  primaryDark: '#1A365D',
  primaryMed: '#2B6CB0',
  primary: '#1A365D',
  primaryLight: '#2B6CB0',
  secondary: '#E53E3E',
  secondaryDark: '#B51822',
  bgPage: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf5 50%, #f5f7fa 100%)',
  bgCard: 'rgba(255, 255, 255, 0.85)',
  borderCard: 'rgba(26, 54, 93, 0.08)',
  shadowCard: '0 4px 24px rgba(0, 0, 0, 0.06)',
  textPrimary: '#0d1c2e',
  textSecondary: '#43474e',
  textMuted: '#74777f',
  hoverBg: 'rgba(26,54,93,0.06)',
  hoverBorder: 'rgba(26,54,93,0.12)',
  subtleBg: 'rgba(26,54,93,0.04)',
  subtleBorder: 'rgba(26,54,93,0.08)',
  rowBg: 'rgba(26,54,93,0.02)',
  gridStroke: 'rgba(26,54,93,0.08)',
  tooltipBg: '#ffffff',
  tooltipBorder: 'rgba(26,54,93,0.15)',
  loaderBg: 'rgba(26, 54, 93, 0.06)',
  tagBg: 'rgba(26,54,93,0.06)',
  tagBorder: 'rgba(26,54,93,0.12)',
  tagText: '#2B6CB0',
  greenLight: '#38a169',
  amberLight: '#d69e2e',
};

function makeStyles(T: typeof BRAND_DARK) {
  return {
    page: {
      minHeight: '100vh',
      background: T.bgPage,
      padding: '32px',
      color: T.textPrimary,
    } as React.CSSProperties,
    header: {
      marginBottom: 32,
    } as React.CSSProperties,
    title: {
      fontSize: 32,
      fontWeight: 800,
      color: T.textPrimary,
      letterSpacing: '-0.03em',
      fontFamily: "'Hanken Grotesk', sans-serif",
      margin: 0,
    } as React.CSSProperties,
    subtitle: {
      color: T.textSecondary,
      marginTop: 6,
      fontSize: 14,
      fontWeight: 500,
    } as React.CSSProperties,
    glassCard: {
      background: T.bgCard,
      backdropFilter: 'blur(16px)',
      border: `1px solid ${T.borderCard}`,
      borderRadius: 16,
      padding: 24,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: T.shadowCard,
    } as React.CSSProperties,
    sectionTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: T.textPrimary,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
    } as React.CSSProperties,
    iconBadge: (gradient: string) => ({
      width: 32,
      height: 32,
      borderRadius: 10,
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 4px 12px ${gradient.includes('#') ? gradient.match(/#[a-f0-9]+/i)?.[0] || '#000' : '#000'}33`,
    }) as React.CSSProperties,
    insightCard: (bg: string, border: string) => ({
      padding: 20,
      borderRadius: 16,
      background: bg,
      border: `1px solid ${border}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
    }) as React.CSSProperties,
  };
}

function Dashboard() {
  const dark = useTheme();
  const T = dark ? BRAND_DARK : BRAND_LIGHT;
  const styles = makeStyles(T);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [tendencias, setTendencias] = useState<TendenciaData | null>(null);
  const [respuesta, setRespuesta] = useState<RespuestaData | null>(null);
  const [agentes, setAgentes] = useState<AgenteData[]>([]);
  const [demanda, setDemanda] = useState<DemandaData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [aiInsights, setAiInsights] = useState<InsightData[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profitLoading, setProfitLoading] = useState(true);
  const [profitError, setProfitError] = useState(false);
  const [activeTab, setActiveTab] = useState<'mas' | 'menos'>('mas');

  useEffect(() => {
    Promise.all([
      api.get('/analytics').then(r => setData(r.data)),
      api.get('/analytics/tendencias').then(r => setTendencias(r.data)),
      api.get('/analytics/respuesta').then(r => setRespuesta(r.data)),
      api.get('/analytics/agentes').then(r => setAgentes(r.data.agentes)),
      api.get('/analytics/demanda').then(r => setDemanda(r.data)),
      api.get('/analytics/insights').then(r => setInsights(r.data.insights)),
    ]).catch(() => {}).finally(() => setLoading(false));

    api.get('/analytics/ai-insights')
      .then(r => setAiInsights(r.data.insights))
      .catch(() => {})
      .finally(() => setAiLoading(false));

    api.get('/analytics/profit')
      .then(r => setProfit(r.data))
      .catch(() => setProfitError(true))
      .finally(() => setProfitLoading(false));
  }, []);

  const leads = data?.leads;
  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;
  const productosMostrados = activeTab === 'mas' ? (profit?.productos_mas_vendidos || []) : (profit?.productos_menos_vendidos || []);

  const insightStyles: Record<string, { gradient: string; border: string; iconColor: string }> = {
    alerta: { gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(181,24,34,0.05) 100%)', border: 'rgba(239,68,68,0.3)', iconColor: '#f87171' },
    oportunidad: { gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)', border: 'rgba(245,158,11,0.3)', iconColor: '#fbbf24' },
    tendencia: { gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(26,54,93,0.05) 100%)', border: 'rgba(59,130,246,0.3)', iconColor: '#60a5fa' },
    sugerencia: { gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)', border: 'rgba(16,185,129,0.3)', iconColor: '#34d399' },
  };

  const insightIcons: Record<string, any> = {
    alerta: AlertTriangle,
    oportunidad: Target,
    tendencia: TrendingUp,
    sugerencia: Zap,
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Inteligencia de negocio para tu tienda de autopartes</p>
          </div>
          <div style={{
            padding: '10px 20px', borderRadius: 12,
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)',
            fontSize: 13, fontWeight: 600, color: T.greenLight,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.greenLight, boxShadow: `0 0 8px ${T.greenLight}`, animation: 'pulse 2s infinite' }} />
            Tiempo real
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {(aiLoading || aiInsights.length > 0) && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
            }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Insights IA</h2>
              {aiLoading && <span style={{ fontSize: 12, color: T.textSecondary }}>Analizando datos con GPT-4o-mini...</span>}
            </div>
          </div>
          {aiLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  ...styles.glassCard,
                  height: 160,
                  background: 'rgba(26, 54, 93, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div className="msg-spinner" style={{ width: 24, height: 24, borderColor: '#8b5cf6', borderTopColor: 'transparent' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(aiInsights.length, 3)}, 1fr)`, gap: 16 }}>
              {aiInsights.slice(0, 3).map((insight, i) => {
                const s = insightStyles[insight.tipo] || insightStyles.sugerencia;
                const Icon = insightIcons[insight.tipo] || Zap;
                return (
                  <div key={i}
                    style={styles.insightCard(s.gradient, s.border)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Icon size={16} style={{ color: s.iconColor }} />
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: s.iconColor,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        padding: '3px 8px', borderRadius: 6,
                        background: `${s.iconColor}18`,
                      }}>
                        {insight.prioridad}
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                        color: '#a78bfa', padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(139,92,246,0.15)',
                      }}>IA</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 8, lineHeight: 1.3 }}>{insight.titulo}</p>
                    <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, marginBottom: 14 }}>{insight.descripcion}</p>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: s.iconColor,
                      display: 'flex', alignItems: 'flex-start', gap: 6,
                      padding: '8px 10px', borderRadius: 8,
                      background: `${s.iconColor}10`,
                    }}>
                      <Zap size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                      <span>{insight.accion}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Fallback rule-based insights */}
      {!aiLoading && aiInsights.length === 0 && insights.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #1A365D, #2B6CB0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={18} color="#fff" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Insights</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(insights.length, 3)}, 1fr)`, gap: 16 }}>
            {insights.slice(0, 3).map((insight, i) => {
              const s = insightStyles[insight.tipo] || insightStyles.sugerencia;
              const Icon = insightIcons[insight.tipo] || Zap;
              return (
                <div key={i} style={styles.insightCard(s.gradient, s.border)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Icon size={16} style={{ color: s.iconColor }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.iconColor, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, background: `${s.iconColor}18` }}>
                      {insight.prioridad}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{insight.titulo}</p>
                  <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, marginBottom: 14 }}>{insight.descripcion}</p>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.iconColor, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, background: `${s.iconColor}10` }}>
                    <Zap size={12} /> {insight.accion}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Leads', value: data?.total_leads ?? 0, icon: Users, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: '#3b82f6' },
          { label: 'Conversion', value: `${data?.tasa_conversion ?? 0}%`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: '#10b981' },
          { label: 'Chats Activos', value: data?.chats_activos ?? 0, icon: MessageCircle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: '#f59e0b' },
          { label: 'Facturado (30d)', value: profit ? formatCurrency(profit.total_facturado) : '—', icon: DollarSign, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: '#ef4444', sub: profit ? `${formatNumber(profit.facturas_periodo)} facturas` : undefined },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              ...styles.glassCard,
              display: 'flex', alignItems: 'center', gap: 16,
              animationDelay: `${i * 60}ms`,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${kpi.shadow}22`; e.currentTarget.style.borderColor = `${kpi.shadow}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: kpi.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${kpi.shadow}44`,
              }}>
                <Icon size={24} color="#fff" />
              </div>
              <div>
                <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.textPrimary, marginTop: 2, fontFamily: "'Hanken Grotesk', sans-serif", letterSpacing: '-0.03em' }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{kpi.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Metrics Mini */}
      {leads && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Nuevos Hoy', value: leads.nuevos_hoy, icon: UserPlus, color: '#3b82f6' },
            { label: 'Pendientes', value: leads.pendientes_respuesta, icon: Clock, color: '#f59e0b' },
            { label: 'Urgencia Alta', value: leads.por_urgencia.Alta, icon: AlertTriangle, color: '#ef4444' },
            { label: 'Sin Asignar', value: leads.por_asignacion.sin_asignar, icon: Headphones, color: '#a78bfa' },
            { label: 'Resueltos', value: leads.por_estado.resuelto, icon: CheckCircle, color: '#34d399' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{
                ...styles.glassCard,
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${item.color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)'; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `linear-gradient(135deg, ${item.color}30, ${item.color}10)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} style={{ color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, fontFamily: "'Hanken Grotesk', sans-serif" }}>{formatNumber(item.value)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row 1: Trends + Response */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 28 }}>
          {[1,2].map(i => <div key={i} style={{ ...styles.glassCard, height: 300 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Trends */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #3b82f6, #2563eb)')}>
                <TrendingUp size={16} color="#fff" />
              </div>
              Leads — Ultimos 30 dias
            </div>
            {tendencias && tendencias.tendencias.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={tendencias.tendencias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: T.textMuted }} tickFormatter={v => v.slice(5)} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMuted }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', background: T.tooltipBg, color: T.textPrimary, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: T.textSecondary }} />
                  <Line type="monotone" dataKey="leads" stroke="#60a5fa" strokeWidth={2.5} dot={{ fill: '#60a5fa', r: 3 }} activeDot={{ r: 5 }} name="Leads" />
                  <Line type="monotone" dataKey="ventas" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 3 }} activeDot={{ r: 5 }} name="Ventas" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 0', color: T.textMuted }}>
                <TrendingUp size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Sin datos de tendencias</p>
              </div>
            )}
          </div>

          {/* Response Time */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #f59e0b, #d97706)')}>
                <Timer size={16} color="#fff" />
              </div>
              Tiempo de Respuesta
            </div>
            {respuesta ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    fontSize: 42, fontWeight: 800,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                  }}>
                    {formatTime(respuesta.promedio_general_segundos)}
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Promedio general</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{respuesta.respuestas_rapidas}</div>
                    <div style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 600 }}>{'< 5 min'}</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>{respuesta.respuestas_lentas}</div>
                    <div style={{ fontSize: 10, color: '#fca5a5', fontWeight: 600 }}>{'> 1 hora'}</div>
                  </div>
                </div>
                {respuesta.por_canal.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {respuesta.por_canal.map(c => (
                      <div key={c.canal} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(59,130,246,0.05)',
                      }}>
                        <span style={{ fontSize: 12, color: T.textSecondary, textTransform: 'capitalize' }}>{c.canal}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{formatTime(c.promedio_segundos)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
                <Timer size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Row 2: Channel + Funnel */}
      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Channel */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #ef4444, #dc2626)')}>
                <PieChart size={16} color="#fff" />
              </div>
              Conversion por Canal
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.traffic}>
                <XAxis dataKey="canal" tick={{ fontSize: 12, fill: T.textSecondary }} />
                <YAxis tick={{ fontSize: 10, fill: T.textMuted }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', background: T.tooltipBg, color: T.textPrimary, fontSize: 12 }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={44}>
                  {data.traffic.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #8b5cf6, #7c3aed)')}>
                <BarChart3 size={16} color="#fff" />
              </div>
              Embudo de Ventas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.funnel.map((item) => {
                const pct = maxFunnel > 0 ? (item.valor / maxFunnel) * 100 : 0;
                return (
                  <div key={item.etapa}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{item.etapa}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: "'Hanken Grotesk', sans-serif" }}>{formatNumber(item.valor)}</span>
                    </div>
                    <div style={{ height: 10, background: 'rgba(59,130,246,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
                        borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 0 12px ${item.color}44`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 3: Agents + Demand */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Agents */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #10b981, #059669)')}>
                <Star size={16} color="#fff" />
              </div>
              Rendimiento por Agente
            </div>
            {agentes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {agentes.map((a, i) => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(59,130,246,0.05)',
                    border: '1px solid rgba(59,130,246,0.08)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.08)'; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `linear-gradient(135deg, hsl(${i * 72}, 70%, 50%), hsl(${i * 72}, 70%, 40%))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                      {a.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{a.nombre}</div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {a.chats_asignados} chats · {a.ventas_cerradas} ventas · {formatTime(a.tiempo_respuesta_promedio)}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: a.tasa_conversion > 20 ? 'rgba(16,185,129,0.15)' : a.tasa_conversion > 10 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 18, fontWeight: 800,
                        color: a.tasa_conversion > 20 ? '#34d399' : a.tasa_conversion > 10 ? '#fbbf24' : '#f87171',
                        fontFamily: "'Hanken Grotesk', sans-serif",
                      }}>
                        {a.tasa_conversion}%
                      </div>
                      <div style={{ fontSize: 9, color: T.textMuted }}>conversion</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
                <Users size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de agentes</p>
              </div>
            )}
          </div>

          {/* Product Demand */}
          <div style={styles.glassCard}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #f59e0b, #d97706)')}>
                <Eye size={16} color="#fff" />
              </div>
              Demanda de Productos
            </div>
            {demanda ? (
              <div>
                {demanda.busquedas_populares.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lo que buscan</div>
                    {demanda.busquedas_populares.slice(0, 4).map((b, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.08)',
                      }}>
                        <span style={{ fontSize: 12, color: T.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.termino}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginLeft: 8 }}>{b.total}</span>
                      </div>
                    ))}
                  </div>
                )}
                {demanda.marcas_populares.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Marcas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {demanda.marcas_populares.slice(0, 5).map((m, i) => (
                        <span key={i} style={{
                          padding: '5px 12px', borderRadius: 8,
                          background: 'rgba(96,165,250,0.1)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          fontSize: 12, fontWeight: 600, color: '#93c5fd',
                        }}>
                          {m.marca} <span style={{ color: '#60a5fa', marginLeft: 4 }}>{m.total}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {demanda.busquedas_sin_venta > 0 && (
                  <div style={{
                    marginTop: 14, padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>
                      {demanda.busquedas_sin_venta} busquedas sin venta
                    </div>
                    <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>Clientes buscaron pero no compraron</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted }}>
                <Package size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de demanda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Row: Products + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={styles.glassCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={styles.sectionTitle}>
              <div style={styles.iconBadge('linear-gradient(135deg, #3b82f6, #2563eb)')}>
                <Package size={16} color="#fff" />
              </div>
              Productos Profit
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(59,130,246,0.08)', borderRadius: 8, padding: 4 }}>
              {[
                { key: 'mas' as const, label: 'Top', icon: ArrowUp, color: '#34d399' },
                { key: 'menos' as const, label: 'Bajo', icon: ArrowDown, color: '#f87171' },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: activeTab === tab.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: activeTab === tab.key ? T.textPrimary : T.textMuted,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.2s',
                  }}>
                    <Icon size={12} style={{ color: tab.color }} />{tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          {profitLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <div key={i} style={{ height: 40, borderRadius: 8, background: 'rgba(59,130,246,0.05)' }} />)}</div>
          ) : profitError ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: T.textMuted }}>
              <ShoppingCart size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>Profit no conectado</p>
              <p style={{ fontSize: 11, marginTop: 4, color: T.textMuted }}>Configura PROFIT_API_URL</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {productosMostrados.slice(0, 6).map((p, i) => (
                <div key={p.co_art} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(59,130,246,0.03)',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.03)'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: activeTab === 'mas' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    color: activeTab === 'mas' ? '#34d399' : '#f87171',
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.art_des}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{formatNumber(p.cantidad_vendida)} uds</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{formatCurrency(p.total_vendido)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.glassCard}>
          <div style={styles.sectionTitle}>
            <div style={styles.iconBadge('linear-gradient(135deg, #ef4444, #dc2626)')}>
              <MapPin size={16} color="#fff" />
            </div>
            Ubicacion de Clientes
          </div>
          {profitLoading ? (
            <div style={{ height: 300, borderRadius: 12, background: 'rgba(59,130,246,0.05)' }} />
          ) : (
            <VenezuelaMap clientes={profit?.clientes_ubicacion || []} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
