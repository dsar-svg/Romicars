USE autoparts_flow;

-- Agregar columnas de bot-first a clientes
SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'modo_atencion');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN modo_atencion ENUM(\"bot\",\"agente\",\"transfiriendo\") DEFAULT \"bot"', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'asignado_a');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN asignado_a INT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'autoparts_flow' AND table_name = 'clientes' AND column_name = 'resumen_transferencia');
SET @sql = IF(@exists = 0, 'ALTER TABLE clientes ADD COLUMN resumen_transferencia TEXT DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
