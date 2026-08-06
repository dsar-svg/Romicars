import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, LayoutDashboard, Send, Shield, Menu, ChevronLeft, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { connectSocket } from '../services/socket';
import type { Mensaje } from '../types';

declare global {
  interface Window { __unreadChats?: Set<number>; }
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inbox', label: 'Inbox', icon: MessageSquare },
  { path: '/campanas', label: 'Campañas', icon: Send },
];

const adminItems = [
  { path: '/admin/agentes', label: 'Admin Agentes', icon: Shield },
];

function Layout() {
  const location = useLocation();
  const { agente, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [unread, setUnread] = useState(0);
  const inboxActive = location.pathname.startsWith('/inbox');

  useEffect(() => {
    if (!window.__unreadChats) window.__unreadChats = new Set<number>();
    const socket = connectSocket();

    socket.on('message:new', (mensaje: Mensaje) => {
      const set = window.__unreadChats!;
      if (!inboxActive) {
        set.add(mensaje.cliente_id);
        setUnread(set.size);
        window.dispatchEvent(new CustomEvent('unread-sync'));
      }
    });

    return () => {
      socket.off('message:new');
    };
  }, [inboxActive]);

  useEffect(() => {
    if (inboxActive) {
      setUnread(0);
    }
  }, [inboxActive]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: collapsed ? 68 : 248,
        background: 'var(--sidebar-bg)',
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
              background: 'var(--secondary)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff', padding: 0, zIndex: 10,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
        >
          {collapsed ? <Menu size={13} /> : <ChevronLeft size={13} />}
        </button>

        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: collapsed ? '24px 14px 28px' : '24px 20px 28px',
          textDecoration: 'none',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(181,24,34,0.3)',
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
                fontSize: 16, fontWeight: 700, color: '#fff',
                letterSpacing: '-0.02em',
                fontFamily: 'Hanken Grotesk, sans-serif',
              }}>
                Romicars Flow
              </span>
          )}
        </Link>

        <nav style={{
          flex: 1, padding: collapsed ? '20px 6px' : '20px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {navItems.map((item, _i) => {
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
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: active
                    ? 'rgba(229,62,62,0.2)'
                    : 'transparent',
                  fontSize: 14, fontWeight: active ? 700 : 500,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  borderLeft: active && !collapsed ? '3px solid #E53E3E' : '3px solid transparent',
                }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'var(--sidebar-hover)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon size={20} />
                  {item.path === '/inbox' && unread > 0 && (
                    <div style={{
                      position: 'absolute', top: -8, right: -10,
                      minWidth: 20, height: 20, borderRadius: 10,
                      background: '#DC2626', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      border: '2px solid #0A1628',
                      padding: '0 5px',
                      boxShadow: '0 2px 6px rgba(220,38,38,0.4)',
                    }}>
                      {unread > 99 ? '99+' : unread}
                    </div>
                  )}
                </div>
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
                        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                        background: active
                          ? 'var(--sidebar-active)'
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
            background: 'var(--secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Sun size={13} style={{ color: dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', transition: 'color 0.2s' }} />
                <button
                  onClick={() => setDark(!dark)}
                  style={{
                    width: 28, height: 16, borderRadius: 8,
                    background: dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.35)',
                    border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: '#fff', position: 'absolute', top: 2,
                    left: dark ? 14 : 2, transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <Moon size={13} style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }} />
              </div>
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
        flex: 1, overflow: 'auto', background: 'var(--surface)',
        position: 'relative',
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
