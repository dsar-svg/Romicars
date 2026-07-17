import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/inbox',
    label: 'Inbox',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    path: '/campanas',
    label: 'Campañas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    ),
  },
];

function Layout() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 240,
        background: 'var(--azul-oscuro)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 20px 24px', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <img src="/logotipo.png" alt="AutoParts Flow" style={{ height: 36 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.3px' }}>AutoParts Flow</span>
        </Link>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                background: active ? 'var(--rojo-primario)' : 'transparent',
                fontSize: 14, fontWeight: 500,
                transition: 'all 0.2s',
              }}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--rojo-primario)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Agente</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>En línea</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--gris-fondo)' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
