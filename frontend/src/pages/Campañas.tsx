function Campañas() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, color: 'var(--gris-oscuro)', marginBottom: 8 }}>Campañas de Remarketing</h1>
      <p style={{ color: 'var(--gris-texto)', marginBottom: 24 }}>
        Segmenta y envía promociones sin pagar plantillas de Meta
      </p>

      <div className="card" style={{ padding: 24 }}>
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

        <div style={{ marginBottom: 20 }}>
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

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gris-oscuro)', marginBottom: 6 }}>
            Mensaje de campaña
          </label>
          <textarea rows={5}
            placeholder="Redacta tu mensaje promocional. Puedes usar {nombre} y {modelo} como variables de personalización..."
            style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-primary" style={{ padding: '12px 32px' }}>
            Enviar Campaña
          </button>
          <span style={{ fontSize: 13, color: 'var(--gris-texto)' }}>
            Los mensajes se enviarán con retardo aleatorio (45-120s) para evitar baneos
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ color: 'var(--gris-oscuro)', marginBottom: 16 }}>Historial de Campañas</h3>
        <p style={{ color: 'var(--gris-texto)', fontSize: 14 }}>Aún no se han enviado campañas</p>
      </div>
    </div>
  );
}

export default Campañas;
