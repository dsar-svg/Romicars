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

interface TendenciaData {
  tendencias: { fecha: string; leads: number; ventas: number }[];
}

interface RespuestaData {
  promedio_general_segundos: number;
  por_canal: { canal: string; promedio_segundos: number; total_conversaciones: number }[];
  total_conversaciones: number;
  respuestas_rapidas: number;
  respuestas_lentas: number;
}

interface AgenteData {
  id: number;
  nombre: string;
  chats_asignados: number;
  ventas_cerradas: number;
  no_ventas: number;
  tasa_conversion: number;
  tiempo_respuesta_promedio: number;
}

interface DemandaData {
  busquedas_populares: { termino: string; total: number }[];
  marcas_populares: { marca: string; total: number }[];
  motores_populares: { motor: string; total: number }[];
  busquedas_sin_venta: number;
  total_con_busqueda: number;
}

interface InsightData {
  tipo: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  accion: string;
}

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

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-VE').format(n);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${Math.round(seconds / 3600)}h`;
}

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [tendencias, setTendencias] = useState<TendenciaData | null>(null);
  const [respuesta, setRespuesta] = useState<RespuestaData | null>(null);
  const [agentes, setAgentes] = useState<AgenteData[]>([]);
  const [demanda, setDemanda] = useState<DemandaData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
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

    api.get('/analytics/profit')
      .then(r => setProfit(r.data))
      .catch(() => setProfitError(true))
      .finally(() => setProfitLoading(false));
  }, []);

  const leads = data?.leads;
  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;
  const productosMostrados = activeTab === 'mas' ? (profit?.productos_mas_vendidos || []) : (profit?.productos_menos_vendidos || []);

  const insightConfig: Record<string, { icon: any; color: string; bg: string }> = {
    alerta: { icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2' },
    oportunidad: { icon: Target, color: '#F59E0B', bg: '#FFFBEB' },
    tendencia: { icon: TrendingUp, color: '#3B82F6', bg: '#EFF6FF' },
    sugerencia: { icon: Lightbulb, color: '#10B981', bg: '#ECFDF5' },
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: "'Hanken Grotesk', sans-serif" }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>Inteligencia de negocio para tu tienda de autopartes</p>
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--surface-card)', borderRadius: 20, border: '1px solid var(--outline)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
          Tiempo real
        </div>
      </div>

      {/* Insights Section */}
      {!loading && insights.length > 0 && (
        <div className="fade-in-up" style={{ marginBottom: 24, animationDelay: '100ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Brain size={18} style={{ color: '#8B5CF6' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Insights y Sugerencias</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(insights.length, 3)}, 1fr)`, gap: 14 }}>
            {insights.slice(0, 3).map((insight, i) => {
              const cfg = insightConfig[insight.tipo] || insightConfig.sugerencia;
              const Icon = cfg.icon;
              return (
                <div key={i} className="fade-in-up" style={{
                  padding: 18, borderRadius: 14, background: cfg.bg,
                  border: `1px solid ${cfg.color}22`, animationDelay: `${i * 60 + 100}ms`,
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {insight.prioridad}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{insight.titulo}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 8 }}>{insight.descripcion}</p>
                  <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={11} /> {insight.accion}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Leads', value: data?.total_leads ?? 0, icon: Users, color: '#3B82F6', gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
          { label: 'Tasa Conversion', value: `${data?.tasa_conversion ?? 0}%`, icon: TrendingUp, color: '#10B981', gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' },
          { label: 'Chats Activos', value: data?.chats_activos ?? 0, icon: MessageCircle, color: '#F59E0B', gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' },
          { label: 'Facturado (30d)', value: profit ? formatCurrency(profit.total_facturado) : '—', icon: DollarSign, color: '#EF4444', gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)', sub: profit ? `${formatNumber(profit.facturas_periodo)} facturas` : undefined },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card fade-in-up" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, animationDelay: `${i * 50}ms`, cursor: 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sombra-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sombra-sm)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 11, background: kpi.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} style={{ color: kpi.color }} />
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 1, letterSpacing: '-0.03em', fontFamily: "'Hanken Grotesk', sans-serif" }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{kpi.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Metrics Mini */}
      {leads && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Nuevos Hoy', value: leads.nuevos_hoy, icon: UserPlus, color: '#3B82F6' },
            { label: 'Pendientes', value: leads.pendientes_respuesta, icon: Clock, color: '#F59E0B' },
            { label: 'Urgencia Alta', value: leads.por_urgencia.Alta, icon: AlertTriangle, color: '#EF4444' },
            { label: 'Sin Asignar', value: leads.por_asignacion.sin_asignar, icon: Headphones, color: '#8B5CF6' },
            { label: 'Resueltos', value: leads.por_estado.resuelto, icon: CheckCircle, color: '#10B981' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="fade-in-up" style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-card)', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: 10, animationDelay: `${i * 30 + 200}ms` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{formatNumber(item.value)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row 1: Tendencias + Respuesta */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Lead Trends */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '300ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 18, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} color="#fff" />
              </div>
              Leads en los ultimos 30 dias
            </h3>
            {tendencias && tendencias.tendencias.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tendencias.tendencias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" opacity={0.3} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={v => v.slice(5)} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--outline)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} dot={false} name="Leads" />
                  <Line type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2} dot={false} name="Ventas" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <TrendingUp size={32} style={{ opacity: 0.1, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de tendencias</p>
              </div>
            )}
          </div>

          {/* Tiempo de Respuesta */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '350ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 18, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Timer size={14} color="#fff" />
              </div>
              Tiempo de Respuesta
            </h3>
            {respuesta ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Hanken Grotesk', sans-serif" }}>
                    {formatTime(respuesta.promedio_general_segundos)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Promedio general</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: '#ECFDF5', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{respuesta.respuestas_rapidas}</div>
                    <div style={{ fontSize: 10, color: '#059669' }}>{'< 5 min'}</div>
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, background: '#FEF2F2', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{respuesta.respuestas_lentas}</div>
                    <div style={{ fontSize: 10, color: '#DC2626' }}>{'> 1 hora'}</div>
                  </div>
                </div>
                {respuesta.por_canal.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {respuesta.por_canal.map(c => (
                      <div key={c.canal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.canal}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatTime(c.promedio_segundos)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                <Timer size={32} style={{ opacity: 0.1, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de respuesta</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Row 2: Conversion por Canal + Embudo */}
      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Conversion por Canal */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '400ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 18, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PieChart size={14} color="#fff" />
              </div>
              Conversion por Canal
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.traffic}>
                <XAxis dataKey="canal" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--outline)', fontSize: 12 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={40}>
                  {data.traffic.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Embudo */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '450ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 18, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={14} color="#fff" />
              </div>
              Embudo de Ventas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.funnel.map((item) => {
                const pct = maxFunnel > 0 ? (item.valor / maxFunnel) * 100 : 0;
                return (
                  <div key={item.etapa}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.etapa}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{formatNumber(item.valor)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-dim)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 4, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 3: Agentes + Demanda */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Rendimiento Agentes */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '500ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={14} color="#fff" />
              </div>
              Rendimiento por Agente
            </h3>
            {agentes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {agentes.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: i % 2 === 0 ? 'var(--surface-dim)' : 'transparent' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 60}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {a.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{a.nombre}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {a.chats_asignados} chats · {a.ventas_cerradas} ventas · {formatTime(a.tiempo_respuesta_promedio)} resp.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: a.tasa_conversion > 20 ? '#10B981' : a.tasa_conversion > 10 ? '#F59E0B' : '#EF4444' }}>
                        {a.tasa_conversion}%
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>conversion</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                <Users size={32} style={{ opacity: 0.1, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de agentes</p>
              </div>
            )}
          </div>

          {/* Demanda de Productos */}
          <div className="card fade-in-up" style={{ padding: 22, animationDelay: '550ms' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Eye size={14} color="#fff" />
              </div>
              Demanda de Productos
            </h3>
            {demanda ? (
              <div>
                {demanda.busquedas_populares.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lo que buscan los clientes</div>
                    {demanda.busquedas_populares.slice(0, 5).map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--outline)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.termino}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', marginLeft: 8 }}>{b.total}</span>
                      </div>
                    ))}
                  </div>
                )}
                {demanda.marcas_populares.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Marcas mas buscadas</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {demanda.marcas_populares.slice(0, 6).map((m, i) => (
                        <span key={i} style={{ padding: '4px 10px', borderRadius: 12, background: 'var(--surface-dim)', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {m.marca} <span style={{ color: '#3B82F6', marginLeft: 4 }}>{m.total}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {demanda.busquedas_sin_venta > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                      {demanda.busquedas_sin_venta} busquedas sin venta ({demanda.total_con_busqueda > 0 ? Math.round((demanda.busquedas_sin_venta / demanda.total_con_busqueda) * 100) : 0}%)
                    </div>
                    <div style={{ fontSize: 10, color: '#991B1B', marginTop: 2 }}>Clientes buscaron pero no compraron</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                <Package size={32} style={{ opacity: 0.1, marginBottom: 8 }} />
                <p style={{ fontSize: 12, fontWeight: 600 }}>Sin datos de demanda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Row: Products + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card fade-in-up" style={{ padding: 22, animationDelay: '600ms' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={14} color="#fff" />
              </div>
              Productos Profit
            </h3>
            <div style={{ display: 'flex', gap: 3, background: 'var(--surface-dim)', borderRadius: 7, padding: 3 }}>
              {[
                { key: 'mas' as const, label: 'Top', icon: ArrowUp, color: '#10B981' },
                { key: 'menos' as const, label: 'Bajo', icon: ArrowDown, color: '#EF4444' },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === tab.key ? 'var(--surface-card)' : 'transparent', color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: activeTab === tab.key ? 'var(--sombra-sm)' : 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={10} style={{ color: tab.color }} />{tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          {profitLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}</div>
          ) : profitError ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
              <ShoppingCart size={32} style={{ opacity: 0.1, marginBottom: 8 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>Profit no conectado</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Configura PROFIT_API_URL en el .env</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {productosMostrados.slice(0, 6).map((p, i) => (
                <div key={p.co_art} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: i % 2 === 0 ? 'var(--surface-dim)' : 'transparent' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: activeTab === 'mas' ? '#3B82F618' : '#EF444418', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: activeTab === 'mas' ? '#3B82F6' : '#EF4444', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.art_des}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{formatNumber(p.cantidad_vendida)} uds</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(p.total_vendido)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card fade-in-up" style={{ padding: 22, animationDelay: '650ms' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #EF4444, #DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={14} color="#fff" />
            </div>
            Ubicacion de Clientes
          </h3>
          {profitLoading ? (
            <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
          ) : (
            <VenezuelaMap clientes={profit?.clientes_ubicacion || []} />
          )}
        </div>
      </div>
    </div>
  );
}

function Lightbulb(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/><path d="M10 22h4"/>
    </svg>
  );
}

export default Dashboard;
