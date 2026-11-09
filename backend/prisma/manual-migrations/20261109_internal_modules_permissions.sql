-- Add permission names used by the new internal modules without changing role assignments.
-- Review which roles should receive each permission after applying this script.
INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`)
SELECT permissions_to_add.name, 'web', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT 'aprobaciones.ver' AS name
    UNION ALL SELECT 'aprobaciones.crear'
    UNION ALL SELECT 'aprobaciones.editar'
    UNION ALL SELECT 'asistente.ver'
    UNION ALL SELECT 'auditoria.ver'
    UNION ALL SELECT 'configuracion.ver'
    UNION ALL SELECT 'configuracion.editar'
    UNION ALL SELECT 'cotizaciones.ver'
    UNION ALL SELECT 'cotizaciones.crear'
    UNION ALL SELECT 'cotizaciones.editar'
    UNION ALL SELECT 'reclamaciones.ver'
    UNION ALL SELECT 'reclamaciones.editar'
    UNION ALL SELECT 'reportes.ver'
    UNION ALL SELECT 'respaldo.ver'
) AS permissions_to_add
WHERE NOT EXISTS (
    SELECT 1
    FROM `permissions` existing
    WHERE existing.`name` = permissions_to_add.name
      AND existing.`guard_name` = 'web'
);
