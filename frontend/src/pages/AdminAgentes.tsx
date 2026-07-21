import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import type { Agente, Rol } from '../types';

export default function AdminAgentes() {
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
      setNombre('');
      setEmail('');
      setPassword('');
      setRolId(2);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear agente');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (agente: Agente) => {
    try {
      await api.put(`/agentes/${agente.id}`, { activo: !agente.activo });
      fetchData();
    } catch {
      setError('Error al actualizar agente');
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--gris-oscuro)' }}>Administrar Agentes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #BD060A, #8B0508)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Agente'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#DC2626', fontSize: 13, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, marginBottom: 18 }}>
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: 'var(--gris-fondo)', borderRadius: 12, padding: 24, marginBottom: 28,
          border: '1px solid var(--gris-borde)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)' }}>Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del agente" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)' }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)' }}>Rol</label>
              <select value={rolId} onChange={e => setRolId(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gris-borde)', fontSize: 14, background: 'var(--blanco)' }}>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px', background: 'linear-gradient(135deg, #BD060A, #8B0508)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creando...' : 'Crear Agente'}
          </button>
        </form>
      )}

      <div style={{ background: 'var(--blanco)', borderRadius: 12, border: '1px solid var(--gris-borde)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gris-fondo)', borderBottom: '1px solid var(--gris-borde)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Rol</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Último Acceso</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--gris-texto)', fontWeight: 600 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {agentes.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--gris-borde)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{a.nombre}</td>
                <td style={{ padding: '12px 16px', color: 'var(--gris-texto)' }}>{a.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: a.rol_nombre === 'superadmin' ? '#FEF3C7' : '#E0E7FF',
                    color: a.rol_nombre === 'superadmin' ? '#92400E' : '#3730A3',
                  }}>
                    {a.rol_nombre}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: a.activo ? '#22C55E' : '#EF4444', marginRight: 6,
                  }} />
                  {a.activo ? 'Activo' : 'Inactivo'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--gris-texto)', fontSize: 13 }}>
                  {a.ultimo_acceso ? new Date(a.ultimo_acceso).toLocaleString() : 'Nunca'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => toggleActivo(a)}
                    style={{
                      padding: '4px 12px', borderRadius: 6, border: '1px solid var(--gris-borde)',
                      background: 'var(--blanco)', fontSize: 12, cursor: 'pointer',
                      color: a.activo ? '#EF4444' : '#22C55E', fontWeight: 500,
                    }}
                  >
                    {a.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {agentes.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--gris-texto)' }}>
                  No hay agentes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
