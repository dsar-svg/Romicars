import { useState, useEffect, FormEvent } from 'react';
import { Users, Shield, Plus, UserCheck, UserX, Mail, Lock, Crown } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';
import type { Agente, Rol } from '../types';

const iconBadge = (gradient: string) => ({
  width: 36, height: 36, borderRadius: 10,
  background: gradient,
  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  boxShadow: `0 4px 12px ${gradient.includes('#') ? gradient.match(/#[a-f0-9]+/i)?.[0] || '#000' : '#000'}33`,
});

export default function AdminAgentes() {
  const t = useTheme();
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolId, setRolId] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [a, r] = await Promise.all([
        api.get('/agentes'),
        api.get('/agentes/roles'),
      ]);
      setAgentes(a.data);
      setRoles(r.data);
    } catch {
      setError('Error al cargar datos');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/agentes', { nombre, email, password, rol_id: rolId });
      setNombre(''); setEmail(''); setPassword(''); setRolId(2);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear agente');
    } finally { setLoading(false); }
  };

  const toggleActivo = async (agente: Agente) => {
    try {
      await api.put(`/agentes/${agente.id}`, { activo: !agente.activo });
      fetchData();
    } catch { setError('Error al actualizar agente'); }
  };

  const activeCount = agentes.filter(a => a.activo).length;

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={iconBadge('linear-gradient(135deg, #8b5cf6, #a78bfa')}>
            <Shield size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.textPrimary, fontFamily: "'Hanken Grotesk', sans-serif" }}>
              Administrar Agentes
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
              {agentes.length} agentes · {activeCount} activos
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: showForm ? t.subtleBg : 'var(--primary)',
            color: showForm ? t.textPrimary : '#fff',
            border: showForm ? '1px solid' + t.borderCard : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {showForm ? 'Cancelar' : <><Plus size={16} /> Nuevo Agente</>}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: t.redBg, border: '1px solid' + t.redText + '33', borderRadius: 10, marginBottom: 20, color: t.redText, fontSize: 13, fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          padding: 24, marginBottom: 24,
          background: t.bgCard, backdropFilter: 'blur(16px)',
          border: '1px solid' + t.borderCard, borderRadius: 16, boxShadow: t.shadowCard,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={iconBadge('linear-gradient(135deg, #3b82f6, #2563eb')}>
              <UserCheck size={16} color="#fff" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}>Nuevo Agente</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Users size={12} /> Nombre
              </label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del agente" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Mail size={12} /> Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Lock size={12} /> Contraseña
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, fontWeight: 600, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Crown size={12} /> Rol
              </label>
              <select value={rolId} onChange={e => setRolId(Number(e.target.value))} style={{ width: '100%' }}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: 'var(--primary)', color: '#fff', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}>
            {loading ? 'Creando...' : 'Crear Agente'}
          </button>
        </form>
      )}

      {/* Agent Cards */}
      <div style={{
        background: t.bgCard, backdropFilter: 'blur(16px)',
        border: '1px solid' + t.borderCard, borderRadius: 16, boxShadow: t.shadowCard,
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1fr',
          padding: '14px 20px', borderBottom: '1px solid' + t.borderCard,
          background: t.subtleBg,
        }}>
          {['Nombre', 'Email', 'Rol', 'Estado', 'Último Acceso', 'Acción'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {agentes.map((a, i) => (
          <div key={a.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr 1fr',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < agentes.length - 1 ? '1px solid' + t.borderSubtle : 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Name + Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: `linear-gradient(135deg, hsl(${i * 72}, 60%, 45%), hsl(${i * 72}, 60%, 35%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {a.nombre.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 14 }}>{a.nombre}</span>
            </div>

            {/* Email */}
            <span style={{ color: t.textSecondary, fontSize: 13 }}>{a.email}</span>

            {/* Rol Badge */}
            <span style={{
              display: 'inline-flex', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: a.rol_nombre === 'superadmin' ? t.badgeSuperadmin.bg : t.badgeAgente.bg,
              color: a.rol_nombre === 'superadmin' ? t.badgeSuperadmin.text : t.badgeAgente.text,
              width: 'fit-content', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {a.rol_nombre}
            </span>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: a.activo ? '#22C55E' : '#EF4444',
                boxShadow: a.activo ? '0 0 6px rgba(34,197,94,0.4)' : 'none',
              }} />
              <span style={{ fontSize: 13, color: a.activo ? t.greenText : t.redText, fontWeight: 500 }}>
                {a.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Last Access */}
            <span style={{ color: t.textMuted, fontSize: 12 }}>
              {a.ultimo_acceso ? new Date(a.ultimo_acceso).toLocaleString() : 'Nunca'}
            </span>

            {/* Action */}
            <button
              onClick={() => toggleActivo(a)}
              style={{
                padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${a.activo ? t.redText + '44' : t.greenText + '44'}`,
                background: a.activo ? t.redBg : t.greenBg,
                color: a.activo ? t.redText : t.greenText,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                width: 'fit-content', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {a.activo ? <><UserX size={12} /> Desactivar</> : <><UserCheck size={12} /> Activar</>}
            </button>
          </div>
        ))}

        {agentes.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Users size={40} style={{ color: t.textMuted, opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary }}>No hay agentes registrados</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Crea el primer agente con el botón de arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
