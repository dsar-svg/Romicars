import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
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
      background: '#070e1a',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated orbs */}
      <div style={{
        position: 'absolute', top: -200, left: -200,
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,62,62,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 12s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: -300, right: -200,
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 15s ease-in-out infinite alternate 3s',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(229,62,62,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'drift-slow 10s ease-in-out infinite alternate 6s',
      }} />
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />
      {/* Floating rings */}
      <div style={{
        position: 'absolute', top: '60%', left: '15%',
        width: 200, height: 200, borderRadius: '50%',
        border: '1px solid rgba(229,62,62,0.08)',
        pointerEvents: 'none',
        animation: 'float-up 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '25%',
        width: 120, height: 120, borderRadius: '50%',
        border: '1px solid rgba(59,130,246,0.08)',
        pointerEvents: 'none',
        animation: 'float-up 25s linear infinite 5s',
      }} />

      {/* Card */}
      <div className="fade-in-up" style={{
        background: 'rgba(13,26,46,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(59,130,246,0.12)',
        borderRadius: 20,
        padding: '44px 40px 36px',
        width: 440,
        maxWidth: '92vw',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60%', height: 1, borderRadius: 1,
          background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)',
        }} />

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logotipo.png"
            alt="Romicars"
            style={{ height: 240, marginBottom: 8, filter: 'drop-shadow(0 4px 20px rgba(59,130,246,0.2))' }}
          />
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: '#eaf1ff',
            letterSpacing: '-0.03em', margin: 0,
            fontFamily: "'Hanken Grotesk', sans-serif",
          }}>
            Romicars Flow
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(148,163,184,0.8)', fontSize: 14, fontWeight: 400 }}>
            Accede al panel de gestión
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.9)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Correo electrónico
            </label>
            <div style={{
              position: 'relative',
              border: `1px solid ${focused === 'email' ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.12)'}`,
              borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              transition: 'all 0.2s',
              boxShadow: focused === 'email' ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
            }}>
              <Mail size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: focused === 'email' ? '#60a5fa' : 'rgba(148,163,184,0.5)',
                transition: 'color 0.2s',
              }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="correo@ejemplo.com"
                style={{
                  width: '100%', padding: '12px 14px 12px 42px',
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#eaf1ff', fontSize: 14, fontWeight: 500,
                }}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.9)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <div style={{
              position: 'relative',
              border: `1px solid ${focused === 'pass' ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.12)'}`,
              borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              transition: 'all 0.2s',
              boxShadow: focused === 'pass' ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
            }}>
              <Lock size={16} style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: focused === 'pass' ? '#60a5fa' : 'rgba(148,163,184,0.5)',
                transition: 'color 0.2s',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 48px 12px 42px',
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#eaf1ff', fontSize: 14, fontWeight: 500, letterSpacing: showPassword ? 0 : 4,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer',
                  color: 'rgba(148,163,184,0.7)', borderRadius: 8,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; e.currentTarget.style.color = '#60a5fa'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 18, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <p style={{ color: '#FCA5A5', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px 0',
              background: loading ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
              transition: 'all 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,130,246,0.4)'; }}}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.3)'; }}}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Iniciando sesión...
              </>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', margin: '24px 0 0', fontSize: 12, color: 'rgba(148,163,184,0.5)' }}>
          Plataforma de gestión de clientes © Romicars
        </p>
      </div>
    </div>
  );
}
