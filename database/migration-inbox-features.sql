USE autoparts_flow;

-- Agregar columnas de estado y SLA a clientes
SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'estado_conversacion');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN estado_conversacion ENUM(\"nuevo\",\"en_progreso\",\"resuelto\",\"cerrado\",\"en_pausa\") DEFAULT \"nuevo\"', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'sla_inicio');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN sla_inicio TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Agregar columna de nota interna a mensajes
SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'mensajes' AND column_name = 'es_nota_interna');
SET @sql = IF(@exists = 0, 'ALTER TABLE mensajes ADD COLUMN es_nota_interna BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Crear tabla de notas internas
SET @exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'autoparts_flow' AND table_name = 'notas_internas');
SET @sql = IF(@exists = 0, 'CREATE TABLE notas_internas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  agente_id INT NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE CASCADE
)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Crear tabla de respuestas rapidas
SET @exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'autoparts_flow' AND table_name = 'respuestas_rapidas');
SET @sql = IF(@exists = 0, 'CREATE TABLE respuestas_rapidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agente_id INT NULL,
  atajo VARCHAR(50) NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(50) DEFAULT \"general\",
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE CASCADE
)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Agregar indice en estado_conversacion
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND index_name = 'idx_estado_conversacion');
SET @sql = IF(@exists = 0, 'CREATE INDEX idx_estado_conversacion ON clientes(estado_conversacion)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
