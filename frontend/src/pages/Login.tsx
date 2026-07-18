import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!nombre.trim()) { setError('El nombre es requerido'); setLoading(false); return; }
        await register(nombre, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0A1628',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-30%', right: '-20%',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(211,47,47,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%', left: '-10%',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(21,101,192,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="fade-in-up" style={{
        background: '#fff',
        borderRadius: 20,
        padding: 48,
        width: 420,
        maxWidth: '92vw',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/logotipo.png"
            alt="Romicars"
            style={{ height: 64, marginBottom: 16, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
          />
          <h1 style={{
            fontSize: 22, color: '#1F2937', letterSpacing: '-0.03em', margin: 0,
          }}>
            AutoParts Flow
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14, fontWeight: 400 }}>
            {isRegister ? 'Crea tu cuenta de agente' : 'Accede al panel de gestión'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Nombre completo
              </label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre"
                style={{ width: '100%' }}
              />
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%' }}
              required
            />
          </div>

          {error && (
            <p style={{
              color: '#DC2626', fontSize: 13, margin: '0 0 18px', padding: '10px 14px',
              background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 12, background: 'linear-gradient(135deg, #D32F2F, #B71C1C)',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(211,47,47,0.35)',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '24px 0 0', fontSize: 13, color: '#9CA3AF' }}>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
}
