import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Send, Shield, Menu, ChevronLeft, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/inbox', label: 'Inbox', icon: MessageSquare },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campanas', label: 'Campañas', icon: Send },
];

const adminItems = [
  { path: '/admin/agentes', label: 'Admin Agentes', icon: Shield },
];

function Layout() {
  const location = useLocation();
  const { agente, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 68 : 248,
        background: 'linear-gradient(180deg, #0A1628 0%, #0D1F3C 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 24, right: -14,
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #BD060A, #8B0508)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', padding: 0, zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {collapsed ? <Menu size={13} /> : <ChevronLeft size={13} />}
        </button>

        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: collapsed ? '24px 14px 28px' : '24px 20px 28px',
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <img
            src="/loguito.png"
            alt="Romicars"
            style={{
              height: collapsed ? 38 : 48,
              transition: 'height 0.3s',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          {!collapsed && (
            <span style={{
              fontSize: 16, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em',
              fontFamily: 'Inter, sans-serif',
            }}>
              Romicars Flow
            </span>
          )}
        </Link>

        <nav style={{
          flex: 1, padding: collapsed ? '20px 6px' : '20px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {navItems.map((item, i) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '12px' : '12px 14px',
                  borderRadius: 10, textDecoration: 'none',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: active
                    ? 'linear-gradient(135deg, #BD060A, #8B0508)'
                    : 'transparent',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <div style={{
                    position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                    width: 4, height: 28, background: '#fff', borderRadius: '0 4px 4px 0',
                  }} />
                )}
              </Link>
              );
            })}
            {agente?.rol_nombre === 'superadmin' && (
              <>
                <div style={{
                  margin: '12px 0 6px', padding: '0 14px', fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {collapsed ? '••' : 'Admin'}
                </div>
                {adminItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <Link key={item.path} to={item.path}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: collapsed ? '12px' : '12px 14px',
                        borderRadius: 10, textDecoration: 'none',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                        background: active
                          ? 'linear-gradient(135deg, #BD060A, #8B0508)'
                          : 'transparent',
                        fontSize: 14, fontWeight: active ? 700 : 500,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </>
            )}
        </nav>

        <div style={{
          padding: collapsed ? '16px 8px' : '16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #BD060A, #8B0508)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 2px 6px rgba(189,6,10,0.3)',
          }}>
            {(agente?.nombre || 'A').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {agente?.nombre || 'Agente'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: '#22C55E', marginRight: 6, verticalAlign: 'middle',
                  }} />
                  {agente?.rol_nombre === 'superadmin' ? 'Superadmin' : 'Agente'}
                </div>
              </div>
              <Bell size={16} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              />
              <LogOut size={16} style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={logout}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              />
            </>
          )}
        </div>
      </aside>

      <main style={{
        flex: 1, overflow: 'auto', background: 'var(--gris-fondo)',
        position: 'relative',
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
