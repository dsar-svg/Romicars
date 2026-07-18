import { useEffect, useState } from 'react';
import { Users, TrendingUp, MessageCircle, Clock, BarChart3, PieChart, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

interface AnalyticsData {
  total_leads: number;
  chats_activos: number;
  tasa_conversion: number;
  respuesta_promedio: number;
  funnel: { etapa: string; valor: number; color: string }[];
  traffic: { canal: string; total: number; color: string }[];
}

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).catch(() => {});
  }, []);

  const kpis = [
    {
      label: 'Total Leads',
      value: data?.total_leads ?? '—',
      icon: Users,
      color: '#2563EB',
      bg: '#EFF6FF',
    },
    {
      label: 'Tasa Conversión',
      value: data?.tasa_conversion ?? '—',
      suffix: '%',
      icon: TrendingUp,
      color: '#059669',
      bg: '#ECFDF5',
    },
    {
      label: 'Chats Activos (24h)',
      value: data?.chats_activos ?? '—',
      icon: MessageCircle,
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      label: 'Respuesta Promedio',
      value: data?.respuesta_promedio ?? '—',
      suffix: ' min',
      icon: Clock,
      color: '#DC2626',
      bg: '#FEF2F2',
    },
  ];

  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--gris-oscuro)', letterSpacing: '-0.03em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--gris-texto)', marginTop: 4, fontSize: 14 }}>
            Panel de analítica y métricas clave
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
                background: kpi.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={24} style={{ color: kpi.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--gris-texto)', fontSize: 13, fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--gris-oscuro)', marginTop: 2, letterSpacing: '-0.03em' }}>
                  {kpi.value}{kpi.suffix || ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              <p style={{ fontSize: 13, marginTop: 4, color: '#9CA3AF' }}>Los leads entrantes aparecerán aquí</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {data.funnel.map((item, i) => (
                <div key={item.etapa} className="fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--gris-oscuro)' }}>{item.etapa}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{item.valor}</span>
                  </div>
                  <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.valor / maxFunnel) * 100}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                      borderRadius: 6,
                      transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
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
              <p style={{ fontSize: 13, marginTop: 4, color: '#9CA3AF' }}>Los datos aparecerán al recibir mensajes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.traffic} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="canal" tick={{ fontSize: 13, fill: '#6B7280' }} width={90} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: 13,
                  }}
                />
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
    </div>
  );
}

export default Dashboard;
