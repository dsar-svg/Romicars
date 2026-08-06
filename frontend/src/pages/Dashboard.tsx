import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, MessageCircle, DollarSign,
  BarChart3, PieChart, Activity, Package, MapPin,
  ArrowUp, ArrowDown, ShoppingCart, UserPlus, Clock,
  AlertTriangle, CheckCircle, Headphones,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

interface ProfitData {
  productos_mas_vendidos: {
    co_art: string; art_des: string;
    total_vendido: number; cantidad_vendida: number; existencias: number;
  }[];
  productos_menos_vendidos: {
    co_art: string; art_des: string;
    total_vendido: number; cantidad_vendida: number; existencias: number;
  }[];
  total_facturado: number;
  facturas_periodo: number;
  clientes_ubicacion: {
    co_cli: string; cli_des: string; lat: number; lng: number;
    ciudad: string; estado: string;
  }[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-VE').format(n);
}

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profitLoading, setProfitLoading] = useState(true);
  const [profitError, setProfitError] = useState(false);
  const [activeTab, setActiveTab] = useState<'mas' | 'menos'>('mas');

  useEffect(() => {
    api.get('/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/analytics/profit')
      .then(r => setProfit(r.data))
      .catch(() => setProfitError(true))
      .finally(() => setProfitLoading(false));
  }, []);

  const leads = data?.leads;
  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;

  const productosMostrados = activeTab === 'mas'
    ? (profit?.productos_mas_vendidos || [])
    : (profit?.productos_menos_vendidos || []);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-in-up" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontFamily: "'Hanken Grotesk', sans-serif",
          }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>
            Metricas clave del CRM y ventas
          </p>
        </div>
        <div style={{
          padding: '8px 16px', background: 'var(--surface-card)', borderRadius: 20,
          border: '1px solid var(--outline)', fontSize: 12, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
          Tiempo real
        </div>
      </div>

      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Total Leads',
            value: data?.total_leads ?? 0,
            icon: Users, color: '#3B82F6', bg: '#EFF6FF',
            gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          },
          {
            label: 'Tasa Conversion',
            value: `${data?.tasa_conversion ?? 0}%`,
            icon: TrendingUp, color: '#10B981', bg: '#ECFDF5',
            gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
          },
          {
            label: 'Chats Activos',
            value: data?.chats_activos ?? 0,
            icon: MessageCircle, color: '#F59E0B', bg: '#FFFBEB',
            gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          },
          {
            label: 'Facturado (30d)',
            value: profit ? formatCurrency(profit.total_facturado) : '—',
            icon: DollarSign, color: '#EF4444', bg: '#FEF2F2',
            gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
            sub: profit ? `${formatNumber(profit.facturas_periodo)} facturas` : undefined,
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card fade-in-up" style={{
              padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
              animationDelay: `${i * 60}ms`, cursor: 'default',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sombra-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sombra-sm)'; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: kpi.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${kpi.color}22`,
              }}>
                <Icon size={22} style={{ color: kpi.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {kpi.label}
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 800, color: 'var(--text-primary)',
                  marginTop: 2, letterSpacing: '-0.03em', fontFamily: "'Hanken Grotesk', sans-serif",
                }}>
                  {kpi.value}
                </div>
                {kpi.sub && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    {kpi.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Metrics Row */}
      {leads && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Nuevos Hoy', value: leads.nuevos_hoy, icon: UserPlus, color: '#3B82F6' },
            { label: 'Pendientes', value: leads.pendientes_respuesta, icon: Clock, color: '#F59E0B' },
            { label: 'Urgencia Alta', value: leads.por_urgencia.Alta, icon: AlertTriangle, color: '#EF4444' },
            { label: 'Sin Asignar', value: leads.por_asignacion.sin_asignar, icon: Headphones, color: '#8B5CF6' },
            { label: 'Resueltos', value: leads.por_estado.resuelto, icon: CheckCircle, color: '#10B981' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="fade-in-up" style={{
                padding: '16px 18px', borderRadius: 12,
                background: 'var(--surface-card)',
                border: '1px solid var(--outline)',
                display: 'flex', alignItems: 'center', gap: 12,
                animationDelay: `${i * 40 + 200}ms`,
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${item.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} style={{ color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {formatNumber(item.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 12 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Embudo de Ventas */}
          <div className="card fade-in-up" style={{ padding: 24, animationDelay: '300ms' }}>
            <h3 style={{
              color: 'var(--text-primary)', marginBottom: 22, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart3 size={15} color="#fff" />
              </div>
              Embudo de Ventas
            </h3>
            {(!data || data.funnel.every(f => f.valor === 0)) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <BarChart3 size={36} style={{ opacity: 0.1, marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Sin datos aun</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Los leads entrantes apareceran aqui</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.funnel.map((item, i) => {
                  const pct = maxFunnel > 0 ? (item.valor / maxFunnel) * 100 : 0;
                  return (
                    <div key={item.etapa} className="fade-in-up" style={{ animationDelay: `${i * 80 + 300}ms` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.etapa}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {maxFunnel > 0 ? Math.round(pct) : 0}%
                          </span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: item.color, fontFamily: "'Hanken Grotesk', sans-serif" }}>
                            {formatNumber(item.valor)}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        height: 10, background: 'var(--surface-dim)', borderRadius: 5,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                          borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trafico por Canal */}
          <div className="card fade-in-up" style={{ padding: 24, animationDelay: '400ms' }}>
            <h3 style={{
              color: 'var(--text-primary)', marginBottom: 22, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PieChart size={15} color="#fff" />
              </div>
              Trafico por Canal
            </h3>
            {(!data || data.traffic.every(t => t.total === 0)) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                <PieChart size={36} style={{ opacity: 0.1, marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Sin trafico aun</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Los datos apareceran al recibir mensajes</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.traffic} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="canal" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={80} />
                    <Tooltip contentStyle={{
                      borderRadius: 8, border: '1px solid var(--outline)',
                      boxShadow: 'var(--sombra-md)', fontSize: 12,
                    }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                      {data.traffic.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14 }}>
                  {data.traffic.map(t => (
                    <div key={t.canal} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{t.canal}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatNumber(t.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lead Status + Assignment Row */}
      {leads && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Estado de Conversaciones */}
          <div className="card fade-in-up" style={{ padding: 24, animationDelay: '450ms' }}>
            <h3 style={{
              color: 'var(--text-primary)', marginBottom: 20, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={15} color="#fff" />
              </div>
              Estado de Conversaciones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'nuevo', label: 'Nuevo', color: '#EF4444', icon: '🔴' },
                { key: 'en_progreso', label: 'En progreso', color: '#3B82F6', icon: '🔵' },
                { key: 'en_pausa', label: 'En pausa', color: '#F59E0B', icon: '⏸️' },
                { key: 'resuelto', label: 'Resuelto', color: '#10B981', icon: '✅' },
                { key: 'cerrado', label: 'Cerrado', color: '#6B7280', icon: '⭕' },
              ].map(item => {
                const val = leads.por_estado[item.key as keyof typeof leads.por_estado] || 0;
                const total = leads.por_estado.nuevo + leads.por_estado.en_progreso + leads.por_estado.resuelto + leads.por_estado.cerrado + leads.por_estado.en_pausa;
                const pct = total > 0 ? (val / total) * 100 : 0;
                return (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, width: 14 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', width: 80 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--surface-dim)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: item.color, borderRadius: 4,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color, width: 36, textAlign: 'right' }}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asignacion de Agentes */}
          <div className="card fade-in-up" style={{ padding: 24, animationDelay: '500ms' }}>
            <h3 style={{
              color: 'var(--text-primary)', marginBottom: 20, fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Headphones size={15} color="#fff" />
              </div>
              Asignacion de Agentes
            </h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'Asignados', value: leads.por_asignacion.asignados, color: '#10B981', icon: CheckCircle },
                { label: 'Sin asignar', value: leads.por_asignacion.sin_asignar, color: '#F59E0B', icon: Clock },
              ].map((item) => {
                const Icon = item.icon;
                const total = leads.por_asignacion.asignados + leads.por_asignacion.sin_asignar;
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={item.label} style={{
                    flex: 1, padding: 20, borderRadius: 12,
                    background: `${item.color}08`, border: `1px solid ${item.color}22`,
                    textAlign: 'center',
                  }}>
                    <Icon size={24} style={{ color: item.color, margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 28, fontWeight: 800, color: item.color, fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      {formatNumber(item.value)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{item.label}</div>
                    <div style={{
                      marginTop: 10, height: 6, background: 'var(--surface-dim)', borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{Math.round(pct)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Products + Map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card fade-in-up" style={{ padding: 24, animationDelay: '550ms' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18,
          }}>
            <h3 style={{
              color: 'var(--text-primary)', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={15} color="#fff" />
              </div>
              Productos
            </h3>
            <div style={{ display: 'flex', gap: 3, background: 'var(--surface-dim)', borderRadius: 8, padding: 3 }}>
              {[
                { key: 'mas' as const, label: 'Mas vendidos', icon: ArrowUp, color: '#10B981' },
                { key: 'menos' as const, label: 'Menos vendidos', icon: ArrowDown, color: '#EF4444' },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: activeTab === tab.key ? 'var(--surface-card)' : 'transparent',
                      color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: activeTab === tab.key ? 'var(--sombra-sm)' : 'none',
                      display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={11} style={{ color: tab.color }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {profitLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
            </div>
          ) : profitError ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
              <ShoppingCart size={36} style={{ opacity: 0.1, marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Profit no conectado</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Configura PROFIT_API_URL en el .env del backend</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productosMostrados.slice(0, 7).map((p, i) => (
                <div key={p.co_art} className="fade-in-up" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: i % 2 === 0 ? 'var(--surface-dim)' : 'transparent',
                  animationDelay: `${i * 40 + 550}ms`,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-dim)' : 'transparent'}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: activeTab === 'mas' ? '#3B82F618' : '#EF444418',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: activeTab === 'mas' ? '#3B82F6' : '#EF4444',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {p.art_des}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                      {formatNumber(p.cantidad_vendida)} uds · Stock: {formatNumber(p.existencias)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                    textAlign: 'right', flexShrink: 0,
                  }}>
                    {formatCurrency(p.total_vendido)}
                  </div>
                </div>
              ))}
              {productosMostrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>
                  <Package size={36} style={{ opacity: 0.1, marginBottom: 10 }} />
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Sin datos de productos</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card fade-in-up" style={{ padding: 24, animationDelay: '600ms' }}>
          <h3 style={{
            color: 'var(--text-primary)', marginBottom: 18, fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={15} color="#fff" />
            </div>
            Ubicacion de Clientes
          </h3>

          {profitLoading ? (
            <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
          ) : (
            <VenezuelaMap
              clientes={profit?.clientes_ubicacion || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
