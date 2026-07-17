import { Users, TrendingUp, MessageCircle, Clock, BarChart3, PieChart } from 'lucide-react';

const kpis = [
  { label: 'Total Leads', value: '—', icon: Users, color: '#1565C0', bg: '#E3F2FD' },
  { label: 'Tasa Conversión', value: '—%', icon: TrendingUp, color: '#2E7D32', bg: '#E8F5E9' },
  { label: 'Chats Activos', value: '—', icon: MessageCircle, color: '#F9A825', bg: '#FFF8E1' },
  { label: 'Respuesta Promedio', value: '— min', icon: Clock, color: '#D32F2F', bg: '#FFEBEE' },
];

function Dashboard() {
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--gris-oscuro)' }}>Dashboard</h1>
          <p style={{ color: 'var(--gris-texto)', marginTop: 4 }}>Panel de analítica y métricas clave</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
            <BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Exportar
          </button>
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
                  {kpi.value}
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
            {[
              { etapa: 'Leads', pct: 100 },
              { etapa: 'Interesados', pct: 0 },
              { etapa: 'Compraron', pct: 0 },
            ].map(item => (
              <div key={item.etapa}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{item.etapa}</span>
                  <span style={{ fontWeight: 700, color: item.etapa === 'Compraron' ? 'var(--rojo-primario)' : 'var(--azul-primario)' }}>
                    {item.pct}
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--gris-fondo)', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: item.etapa === 'Compraron'
                      ? 'linear-gradient(90deg, var(--rojo-primario), var(--rojo-oscuro))'
                      : 'linear-gradient(90deg, var(--azul-primario), #1976D2)',
                    borderRadius: 5,
                    transition: 'width 1.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 20, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={18} style={{ color: 'var(--rojo-primario)' }} />
            Tráfico por Canal
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { canal: 'WhatsApp', pct: 0, color: 'var(--rojo-primario)' },
              { canal: 'Instagram', pct: 0, color: 'var(--azul-primario)' },
              { canal: 'Facebook', pct: 0, color: '#1565C0' },
            ].map(item => (
              <div key={item.canal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{item.canal}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--gris-fondo)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                    borderRadius: 4,
                    transition: 'width 1.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
