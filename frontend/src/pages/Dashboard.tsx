function Dashboard() {
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, color: 'var(--gris-oscuro)', marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: 'var(--gris-texto)', marginBottom: 24 }}>Panel de analítica y métricas clave</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Leads', value: '—', icon: '📋' },
          { label: 'Tasa Conversión', value: '—%', icon: '📈' },
          { label: 'Chats Activos', value: '—', icon: '💬' },
          { label: 'Respuesta Promedio', value: '— min', icon: '⏱' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: 24 }}>
            <div style={{ color: 'var(--gris-texto)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--azul-oscuro)', marginTop: 8 }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 16 }}>Embudo de Ventas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { etapa: 'Leads', pct: 100 },
              { etapa: 'Interesados', pct: 0 },
              { etapa: 'Compraron', pct: 0 },
            ].map(item => (
              <div key={item.etapa}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{item.etapa}</span>
                  <span style={{ fontWeight: 600 }}>{item.pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--gris-fondo)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: item.etapa === 'Compraron' ? 'var(--rojo-primario)' : 'var(--azul-primario)',
                    borderRadius: 4,
                    transition: 'width 1s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 16 }}>Tráfico por Canal</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { canal: 'WhatsApp', pct: 0, color: 'var(--rojo-primario)' },
              { canal: 'Instagram', pct: 0, color: 'var(--azul-primario)' },
              { canal: 'Facebook', pct: 0, color: '#1565C0' },
            ].map(item => (
              <div key={item.canal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{item.canal}</span>
                  <span style={{ fontWeight: 600 }}>{item.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--gris-fondo)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${item.pct}%`,
                    background: item.color,
                    borderRadius: 3,
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
