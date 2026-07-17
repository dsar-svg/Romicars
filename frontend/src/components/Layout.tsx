import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Send, Menu, ChevronLeft, Bell } from 'lucide-react';

const navItems = [
  { path: '/inbox', label: 'Inbox', icon: MessageSquare },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campanas', label: 'Campañas', icon: Send },
];

function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 72 : 240,
        background: 'linear-gradient(180deg, var(--azul-oscuro) 0%, #0a2e5c 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.3s ease',
        position: 'relative',
      }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 20, right: collapsed ? -12 : -12,
            width: 24, height: 24, borderRadius: '50%', background: 'var(--rojo-primario)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', padding: 0, zIndex: 10,
          }}>
          {collapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
        </button>

        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '20px 16px 24px' : '20px 20px 24px',
          textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <img src="/logotipo.png" alt="" style={{ height: collapsed ? 32 : 36, transition: 'height 0.3s' }} />
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.3px' }}>AutoParts Flow</span>
          )}
        </Link>

        <nav style={{
          flex: 1, padding: collapsed ? '16px 8px' : '16px 12px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '10px' : '10px 14px',
                  borderRadius: 8, textDecoration: 'none',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: active ? 'linear-gradient(135deg, var(--rojo-primario), var(--rojo-oscuro))' : 'transparent',
                  fontSize: 14, fontWeight: 500,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}>
                <Icon size={20} />
                {!collapsed && item.label}
                {active && (
                  <div style={{
                    position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                    width: 4, height: 24, background: '#fff', borderRadius: '0 4px 4px 0',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: collapsed ? '16px 8px' : '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--rojo-primario), var(--rojo-oscuro))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>A</div>
          {!collapsed && (
            <>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Agente</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>En línea</div>
              </div>
              <Bell size={16} style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }} />
            </>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--gris-fondo)' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
