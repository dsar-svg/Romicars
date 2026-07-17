import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/inbox', label: 'Inbox' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/campanas', label: 'Campañas' },
];

function Layout() {
  const location = useLocation();

  return (
    <div>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        height: 64,
        padding: '0 32px',
        background: 'var(--azul-oscuro)',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginRight: 40 }}>
          <img src="/logotipo.png" alt="AutoParts Flow" style={{ height: 40 }} />
        </Link>
        {navItems.map(item => (
          <Link key={item.path} to={item.path}
            style={{
              marginRight: 24,
              padding: '8px 16px',
              borderRadius: 6,
              color: location.pathname.startsWith(item.path) ? '#fff' : 'rgba(255,255,255,0.7)',
              background: location.pathname.startsWith(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export default Layout;
