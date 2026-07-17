import { Send, Filter, History, AlertCircle } from 'lucide-react';

function Campañas() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--gris-oscuro)' }}>Campañas de Remarketing</h1>
        <p style={{ color: 'var(--gris-texto)', marginTop: 4 }}>
          Segmenta y envía promociones sin pagar plantillas de Meta
        </p>
      </div>

      <div className="card fade-in" style={{ padding: 28, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} style={{ color: 'var(--rojo-primario)' }} />
          Segmentar clientes
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>
              Marca del vehículo
            </label>
            <input placeholder="Ej: Honda" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>
              Modelo del vehículo
            </label>
            <input placeholder="Ej: Civic" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>
            Estado de venta
          </label>
          <select style={{ width: '100%', maxWidth: 300 }}>
            <option value="">Todos los estados</option>
            <option value="Lead">Lead</option>
            <option value="Interesado">Interesado</option>
            <option value="No Compro">No Compró</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>
            Mensaje de campaña
          </label>
          <textarea rows={5}
            placeholder="Redacta tu mensaje promocional. Puedes usar {nombre} y {modelo} como variables de personalización..."
            style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} />
            Enviar Campaña
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gris-texto)' }}>
            <AlertCircle size={14} />
            <span>Retardo aleatorio 45-120s entre envíos (anti-baneo)</span>
          </div>
        </div>
      </div>

      <div className="card fade-in" style={{ padding: 28, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} style={{ color: 'var(--azul-primario)' }} />
          Historial de Campañas
        </h3>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gris-texto)' }}>
          <Send size={40} style={{ opacity: 0.15, marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Aún no se han enviado campañas</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Usa el formulario de arriba para crear tu primera campaña</p>
        </div>
      </div>
    </div>
  );
}

export default Campañas;
