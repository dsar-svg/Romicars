USE autoparts_flow;

-- Agregar columnas de pin y eliminado a clientes
SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'pinned');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN pinned TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'eliminado');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN eliminado TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Agregar columnas de pin y eliminado a mensajes
SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'mensajes' AND column_name = 'pinned');
SET @sql = IF(@exists = 0, 'ALTER TABLE mensajes ADD COLUMN pinned TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'mensajes' AND column_name = 'eliminado');
SET @sql = IF(@exists = 0, 'ALTER TABLE mensajes ADD COLUMN eliminado TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
