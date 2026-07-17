import { useEffect, useState } from 'react';
import { Users, TrendingUp, MessageCircle, Clock, BarChart3, PieChart } from 'lucide-react';
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
    { label: 'Total Leads', value: data?.total_leads ?? '—', suffix: '', icon: Users, color: '#1565C0', bg: '#E3F2FD' },
    { label: 'Tasa Conversión', value: data?.tasa_conversion ?? '—', suffix: '%', icon: TrendingUp, color: '#2E7D32', bg: '#E8F5E9' },
    { label: 'Chats Activos (24h)', value: data?.chats_activos ?? '—', suffix: '', icon: MessageCircle, color: '#F9A825', bg: '#FFF8E1' },
    { label: 'Respuesta Promedio', value: data?.respuesta_promedio ?? '—', suffix: ' min', icon: Clock, color: '#D32F2F', bg: '#FFEBEE' },
  ];

  const maxFunnel = data ? Math.max(...data.funnel.map(f => f.valor), 1) : 1;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--gris-oscuro)' }}>Dashboard</h1>
          <p style={{ color: 'var(--gris-texto)', marginTop: 4 }}>Panel de analítica y métricas clave</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 24 }}>
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card fade-in" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: kpi.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} style={{ color: kpi.color }} />
              </div>
              <div>
                <div style={{ color: 'var(--gris-texto)', fontSize: 13, fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gris-oscuro)', marginTop: 2 }}>
                  {kpi.value}{kpi.suffix}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 20, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} style={{ color: 'var(--azul-primario)' }} />
            Embudo de Ventas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data?.funnel ?? []).map(item => (
              <div key={item.etapa}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{item.etapa}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.valor}</span>
                </div>
                <div style={{ height: 10, background: 'var(--gris-fondo)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(item.valor / maxFunnel) * 100}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                    borderRadius: 5,
                    transition: 'width 1.5s ease',
                  }} />
                </div>
              </div>
            ))}
            {(!data || data.funnel.every(f => f.valor === 0)) && (
              <p style={{ color: 'var(--gris-texto)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                Sin datos aún. Los mensajes entrantes aparecerán aquí.
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 20, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} style={{ color: 'var(--rojo-primario)' }} />
            Tráfico por Canal
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.traffic ?? []} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="canal" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                {(data?.traffic ?? []).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {(!data || data.traffic.every(t => t.total === 0)) && (
            <p style={{ color: 'var(--gris-texto)', fontSize: 13, textAlign: 'center', padding: 10 }}>
              Sin datos de tráfico aún.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
