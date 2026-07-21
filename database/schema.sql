CREATE DATABASE IF NOT EXISTS autoparts_flow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE autoparts_flow;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    telefono VARCHAR(20) UNIQUE,
    facebook_psid VARCHAR(100) UNIQUE,
    instagram_psid VARCHAR(100) UNIQUE,
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

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    permisos JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, nombre, permisos) VALUES
(1, 'superadmin', '["inbox","dashboard","campanas","admin.agentes"]'),
(2, 'agente', '["inbox","dashboard","campanas"]');

CREATE TABLE IF NOT EXISTS agentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT DEFAULT 2,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
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

-- =====================================================
-- Auditoría de seguridad (login attempts)
-- =====================================================
CREATE TABLE IF NOT EXISTS login_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    agente_id INT DEFAULT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_audit_email (email),
    INDEX idx_login_audit_ip (ip),
    INDEX idx_login_audit_success (success),
    INDEX idx_login_audit_created (created_at),
    FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- Cache de datos Profit (para reducir llamadas al ERP)
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_cache (
    cache_key VARCHAR(100) PRIMARY KEY,
    data JSON NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_profit_cache_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- Refresh tokens para sesiones persistentes
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agente_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_hash (token_hash),
    INDEX idx_refresh_tokens_agente (agente_id)
) ENGINE=InnoDB;

-- Migración para bases existentes (agregar columnas de PSID)
-- ALTER TABLE clientes
--   ADD COLUMN facebook_psid VARCHAR(100) UNIQUE AFTER telefono,
--   ADD COLUMN instagram_psid VARCHAR(100) UNIQUE AFTER facebook_psid;
