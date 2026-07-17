CREATE DATABASE IF NOT EXISTS autoparts_flow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE autoparts_flow;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    telefono VARCHAR(20) UNIQUE,
    canal_origen ENUM('whatsapp', 'instagram', 'facebook') DEFAULT 'whatsapp',
    marca_carro VARCHAR(50),
    modelo_carro VARCHAR(50),
    anio_carro INT,
    motor_carro VARCHAR(50),
    estado_venta ENUM('Lead', 'Interesado', 'Compro', 'No Compro') DEFAULT 'Lead',
    urgencia ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
    resumen_busqueda TEXT,
    pidio_fotos BOOLEAN DEFAULT FALSE,
    acepta_promos BOOLEAN DEFAULT TRUE,
    ultimo_mensaje TEXT,
    ultima_interaccion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    remitente ENUM('cliente', 'agente', 'bot') NOT NULL,
    contenido TEXT NOT NULL,
    tipo ENUM('texto', 'imagen', 'archivo') DEFAULT 'texto',
    url_multimedia TEXT,
    leido BOOLEAN DEFAULT FALSE,
    asignado_a INT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campañas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    filtro_marca VARCHAR(50),
    filtro_modelo VARCHAR(50),
    filtro_estado_venta ENUM('Lead', 'Interesado', 'Compro', 'No Compro'),
    destinatarios INT DEFAULT 0,
    enviados INT DEFAULT 0,
    estado ENUM('borrador', 'enviando', 'completada', 'cancelada') DEFAULT 'borrador',
    creada_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creada_por) REFERENCES agentes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campania_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campania_id INT NOT NULL,
    cliente_id INT NOT NULL,
    estado ENUM('pendiente', 'enviado', 'error', 'opt_out') DEFAULT 'pendiente',
    error_msg TEXT,
    enviado_en TIMESTAMP NULL,
    FOREIGN KEY (campania_id) REFERENCES campañas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_clientes_estado ON clientes(estado_venta);
CREATE INDEX idx_clientes_modelo ON clientes(modelo_carro);
CREATE INDEX idx_mensajes_cliente ON mensajes(cliente_id);
CREATE INDEX idx_mensajes_fecha ON mensajes(fecha_envio);
CREATE INDEX idx_clientes_promos ON clientes(acepta_promos);
