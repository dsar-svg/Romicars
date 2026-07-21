import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, MessageCircle, DollarSign,
  BarChart3, PieChart, Activity, Package, MapPin,
  ArrowUp, ArrowDown, ShoppingCart,
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

  const kpis = [
    {
      label: 'Total Leads',
      value: data?.total_leads ?? '—',
      icon: Users, color: '#2563EB', bg: '#EFF6FF',
    },
    {
      label: 'Tasa Conversión',
      value: data?.tasa_conversion ?? '—',
      suffix: '%', icon: TrendingUp, color: '#059669', bg: '#ECFDF5',
    },
    {
      label: 'Chats Activos (24h)',
      value: data?.chats_activos ?? '—',
      icon: MessageCircle, color: '#D97706', bg: '#FFFBEB',
    },
    {
      label: profitLoading ? 'Total Facturado' : 'Total Facturado',
      value: profit ? formatCurrency(profit.total_facturado) : (profitError ? '—' : '—'),
      icon: DollarSign, color: '#BD060A', bg: '#FFEDED',
      sub: profit && !profitLoading ? `${formatNumber(profit.facturas_periodo)} facturas` : undefined,
    },
  ];

  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;

  const productosMostrados = activeTab === 'mas'
    ? (profit?.productos_mas_vendidos || [])
    : (profit?.productos_menos_vendidos || []);

  return (
    <div style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      <div className="fade-in-up" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gris-oscuro)', letterSpacing: '-0.03em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--gris-texto)', marginTop: 4, fontSize: 14 }}>
            Métricas clave · Datos CRM + Profit ERP
          </p>
        </div>
        <div style={{
          padding: '8px 16px', background: '#FFF', borderRadius: 10,
          border: '1px solid var(--gris-borde)', fontSize: 13, color: 'var(--gris-texto)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Activity size={14} />
          <span>Actualizado en tiempo real</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 28 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card fade-in-up" style={{
              padding: 24, display: 'flex', alignItems: 'center', gap: 16,
              animationDelay: `${i * 80}ms`,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={24} style={{ color: kpi.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--gris-texto)', fontSize: 13, fontWeight: 500 }}>
                  {kpi.label}
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 800, color: 'var(--gris-oscuro)',
                  marginTop: 2, letterSpacing: '-0.03em',
                }}>
                  {kpi.value}{kpi.suffix || ''}
                </div>
                {kpi.sub && (
                  <div style={{ fontSize: 11, color: 'var(--gris-texto)', marginTop: 1 }}>
                    {kpi.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ marginTop: 28 }}>
          <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 12, marginTop: 20 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 28 }}>
          <div className="card fade-in-up" style={{ padding: 28, animationDelay: '200ms' }}>
            <h3 style={{
              color: 'var(--gris-oscuro)', marginBottom: 24, fontSize: 17, fontWeight: 700,
              letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <BarChart3 size={20} style={{ color: 'var(--azul-primario)' }} />
              Embudo de Ventas
            </h3>
            {(!data || data.funnel.every(f => f.valor === 0)) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gris-texto)' }}>
                <BarChart3 size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>Sin datos aún</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Los leads entrantes aparecerán aquí</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {data.funnel.map((item, i) => (
                  <div key={item.etapa} className="fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: 'var(--gris-oscuro)' }}>{item.etapa}</span>
                      <span style={{ fontWeight: 800, color: item.color }}>{item.valor}</span>
                    </div>
                    <div style={{
                      height: 12, background: '#F3F4F6', borderRadius: 6,
                      overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{
                        height: '100%', width: `${(item.valor / maxFunnel) * 100}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                        borderRadius: 6, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card fade-in-up" style={{ padding: 28, animationDelay: '300ms' }}>
            <h3 style={{
              color: 'var(--gris-oscuro)', marginBottom: 24, fontSize: 17, fontWeight: 700,
              letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <PieChart size={20} style={{ color: 'var(--rojo-primario)' }} />
              Tráfico por Canal
            </h3>
            {(!data || data.traffic.every(t => t.total === 0)) ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gris-texto)' }}>
                <PieChart size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>Sin tráfico aún</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Los datos aparecerán al recibir mensajes</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.traffic} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="canal" tick={{ fontSize: 13, fill: 'var(--gris-texto)' }} width={90} />
                  <Tooltip contentStyle={{
                    borderRadius: 10, border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 13,
                  }} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={28}>
                    {data.traffic.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card fade-in-up" style={{ padding: 28, animationDelay: '400ms' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <h3 style={{
              color: 'var(--gris-oscuro)', fontSize: 17, fontWeight: 700,
              letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Package size={20} style={{ color: 'var(--azul-primario)' }} />
              Productos
            </h3>
            <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setActiveTab('mas')}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: activeTab === 'mas' ? '#fff' : 'transparent',
                  color: activeTab === 'mas' ? 'var(--gris-oscuro)' : 'var(--gris-texto)',
                  boxShadow: activeTab === 'mas' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <ArrowUp size={12} />
                Más vendidos
              </button>
              <button
                onClick={() => setActiveTab('menos')}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: activeTab === 'menos' ? '#fff' : 'transparent',
                  color: activeTab === 'menos' ? 'var(--gris-oscuro)' : 'var(--gris-texto)',
                  boxShadow: activeTab === 'menos' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <ArrowDown size={12} />
                Menos vendidos
              </button>
            </div>
          </div>

          {profitLoading ? (
            <div>
              <div className="skeleton" style={{ height: 32, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, marginBottom: 12 }} />
            </div>
          ) : profitError ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gris-texto)' }}>
              <ShoppingCart size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Profit no conectado</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Configura PROFIT_API_URL en el .env del backend
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productosMostrados.slice(0, 7).map((p, i) => (
                <div key={p.co_art} className="fade-in-up" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  animationDelay: `${i * 50}ms`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: activeTab === 'mas'
                      ? `rgba(1,41,128,${0.1 + (1 - i / 7) * 0.15})`
                      : `rgba(189,6,10,${0.1 + i / 7 * 0.15})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: activeTab === 'mas' ? '#012980' : '#BD060A',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {p.art_des}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gris-texto)', marginTop: 1 }}>
                      {p.co_art} · {formatNumber(p.cantidad_vendida)} uds · Stock: {formatNumber(p.existencias)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, color: 'var(--gris-oscuro)',
                    textAlign: 'right', flexShrink: 0,
                  }}>
                    {formatCurrency(p.total_vendido)}
                  </div>
                </div>
              ))}
              {productosMostrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gris-texto)' }}>
                  <Package size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Sin datos de productos</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card fade-in-up" style={{ padding: 28, animationDelay: '500ms' }}>
          <h3 style={{
            color: 'var(--gris-oscuro)', marginBottom: 20, fontSize: 17, fontWeight: 700,
            letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <MapPin size={20} style={{ color: 'var(--rojo-primario)' }} />
            Ubicación de Clientes
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
