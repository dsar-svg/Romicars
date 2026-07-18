import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inbox', { replace: true });
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
      background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -200, left: -200,
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(189,6,10,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 12s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: -300, right: -200,
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(1,41,128,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 15s ease-in-out infinite alternate 3s',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(189,6,10,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 10s ease-in-out infinite alternate 6s',
      }} />
      <div style={{
        position: 'absolute', top: '60%', left: '15%',
        width: 200, height: 200, borderRadius: '50%',
        border: '1px solid rgba(189,6,10,0.08)',
        pointerEvents: 'none',
        animation: 'float-up 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '25%',
        width: 120, height: 120, borderRadius: '50%',
        border: '1px solid rgba(1,41,128,0.08)',
        pointerEvents: 'none',
        animation: 'float-up 25s linear infinite 5s',
      }} />
      <div style={{
        position: 'absolute', bottom: '30%', left: '30%',
        width: 80, height: 80, borderRadius: '50%',
        border: '1px solid rgba(189,6,10,0.06)',
        pointerEvents: 'none',
        animation: 'float-up 18s linear infinite 10s',
      }} />
      <div className="fade-in-up" style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: 48,
        width: 420,
        maxWidth: '92vw',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/logotipo.png"
            alt="Romicars"
            style={{ height: 80, marginBottom: 20, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
          />
          <h1 style={{
            fontSize: 22, color: '#1F2937', letterSpacing: '-0.03em', margin: 0,
          }}>
            AutoParts Flow
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14, fontWeight: 400 }}>
            Accede al panel de gestión
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 2, top: 2, bottom: 2,
                  width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9CA3AF', borderRadius: 8,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
              width: '100%', padding: 12, background: 'linear-gradient(135deg, #BD060A, #8B0508)',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(189,6,10,0.35)',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '24px 0 0', fontSize: 13, color: '#9CA3AF' }}>
          Plataforma de gestión de clientes © Romicars
        </p>
      </div>
    </div>
  );
}
