-- Indices para listados, auditoria y reportes del panel administrativo.
--
-- Ejecutar con una cuenta administradora (la cuenta de la app horus_app no tiene DDL):
--   mysql -u <admin> -p horus < prisma/manual-migrations/20261111_performance_indexes.sql
--
-- Es idempotente: solo crea el indice si no existe. En tablas grandes (audit_logs)
-- hacerlo en una ventana de bajo trafico; MySQL 8 crea indices en linea (ALGORITHM=INPLACE).

DROP PROCEDURE IF EXISTS horus_add_index;

DELIMITER //
CREATE PROCEDURE horus_add_index(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND index_name = p_index
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END//
DELIMITER ;

-- Auditoria: el listado ordena por fecha y la tabla solo crece.
CALL horus_add_index('audit_logs', 'audit_logs_created_at_id_index', '`created_at`, `id`');
CALL horus_add_index('audit_logs', 'audit_logs_model_index', '`model_type`, `model_id`');
CALL horus_add_index('audit_logs', 'audit_logs_action_index', '`action`');
CALL horus_add_index('audit_logs', 'audit_logs_user_id_created_at_index', '`user_id`, `created_at`');

-- Matriculas: listado (deleted_at + fecha), filtros por curso y estado, reportes.
CALL horus_add_index('matriculas', 'matriculas_deleted_at_fecha_index', '`deleted_at`, `fecha_matricula`, `id`');
CALL horus_add_index('matriculas', 'matriculas_curso_id_index', '`curso_id`');
CALL horus_add_index('matriculas', 'matriculas_estado_fecha_index', '`estado`, `fecha_matricula`');

-- Cursos y estudiantes: listados ordenados y filtrados por estado.
CALL horus_add_index('cursos', 'cursos_deleted_at_nombre_index', '`deleted_at`, `nombre`');
CALL horus_add_index('cursos', 'cursos_estado_index', '`estado`');
CALL horus_add_index('cursos', 'cursos_categoria_index', '`categoria`');
CALL horus_add_index('estudiantes', 'estudiantes_deleted_at_apellidos_index', '`deleted_at`, `apellidos`, `nombres`');
CALL horus_add_index('estudiantes', 'estudiantes_estado_index', '`estado`');

-- Notificaciones y aprobaciones.
CALL horus_add_index('notificaciones_internas', 'notificaciones_user_leida_created_index', '`user_id`, `leida`, `created_at`');
CALL horus_add_index('aprobaciones_internas', 'aprobaciones_estado_created_index', '`estado`, `created_at`');

DROP PROCEDURE horus_add_index;

-- Reversion (si hiciera falta):
--   ALTER TABLE audit_logs DROP INDEX audit_logs_created_at_id_index, DROP INDEX audit_logs_model_index,
--     DROP INDEX audit_logs_action_index, DROP INDEX audit_logs_user_id_created_at_index;
--   ... (mismo patron para el resto)
