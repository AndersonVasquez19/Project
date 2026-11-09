-- Create the staff roles, the permissions the controllers require, and the default role grants.
-- Idempotent: every statement skips rows that already exist.
-- Adjust the grants afterwards from the Roles screen if needed.

-- 1) Roles
INSERT INTO `roles` (`name`, `guard_name`, `created_at`, `updated_at`)
SELECT roles_to_add.name, 'web', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT 'admin' AS name
    UNION ALL SELECT 'coordinador'
    UNION ALL SELECT 'secretaria'
) AS roles_to_add
WHERE NOT EXISTS (
    SELECT 1 FROM `roles` existing
    WHERE existing.`name` = roles_to_add.name AND existing.`guard_name` = 'web'
);

-- 2) Missing permissions used by @RequirePermissions(...)
INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`)
SELECT permissions_to_add.name, 'web', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT 'usuarios.ver' AS name
    UNION ALL SELECT 'usuarios.crear'
    UNION ALL SELECT 'usuarios.editar'
    UNION ALL SELECT 'usuarios.asignar-roles'
    UNION ALL SELECT 'roles.ver'
    UNION ALL SELECT 'roles.editar'
    UNION ALL SELECT 'estudiantes.ver'
    UNION ALL SELECT 'estudiantes.crear'
    UNION ALL SELECT 'estudiantes.editar'
    UNION ALL SELECT 'estudiantes.eliminar'
    UNION ALL SELECT 'estudiantes.restaurar'
    UNION ALL SELECT 'cursos.ver'
    UNION ALL SELECT 'cursos.crear'
    UNION ALL SELECT 'cursos.editar'
    UNION ALL SELECT 'cursos.eliminar'
    UNION ALL SELECT 'cursos.restaurar'
    UNION ALL SELECT 'matriculas.ver'
    UNION ALL SELECT 'matriculas.crear'
    UNION ALL SELECT 'matriculas.editar'
    UNION ALL SELECT 'matriculas.eliminar'
    UNION ALL SELECT 'matriculas.anular'
    UNION ALL SELECT 'matriculas.restaurar'
    UNION ALL SELECT 'servicios.ver'
    UNION ALL SELECT 'servicios.crear'
    UNION ALL SELECT 'servicios.editar'
) AS permissions_to_add
WHERE NOT EXISTS (
    SELECT 1 FROM `permissions` existing
    WHERE existing.`name` = permissions_to_add.name AND existing.`guard_name` = 'web'
);

-- 3a) admin: every web permission
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.`id`, r.`id`
FROM `roles` r
INNER JOIN `permissions` p ON p.`guard_name` = 'web'
WHERE r.`name` = 'admin' AND r.`guard_name` = 'web'
  AND NOT EXISTS (
    SELECT 1 FROM `role_has_permissions` rhp
    WHERE rhp.`role_id` = r.`id` AND rhp.`permission_id` = p.`id`
  );

-- 3b) coordinador: everything except configuration edits, backups and role edits
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.`id`, r.`id`
FROM `roles` r
INNER JOIN `permissions` p ON p.`guard_name` = 'web'
WHERE r.`name` = 'coordinador' AND r.`guard_name` = 'web'
  AND p.`name` NOT IN ('configuracion.editar', 'respaldo.ver', 'roles.editar')
  AND NOT EXISTS (
    SELECT 1 FROM `role_has_permissions` rhp
    WHERE rhp.`role_id` = r.`id` AND rhp.`permission_id` = p.`id`
  );

-- 3c) secretaria: day-to-day operations only (no delete, void, restore, users, roles, settings)
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.`id`, r.`id`
FROM `roles` r
INNER JOIN `permissions` p ON p.`guard_name` = 'web'
WHERE r.`name` = 'secretaria' AND r.`guard_name` = 'web'
  AND p.`name` IN (
    'estudiantes.ver', 'estudiantes.crear', 'estudiantes.editar',
    'matriculas.ver', 'matriculas.crear', 'matriculas.editar',
    'cotizaciones.ver', 'cotizaciones.crear', 'cotizaciones.editar',
    'reclamaciones.ver', 'reclamaciones.editar',
    'aprobaciones.ver', 'aprobaciones.crear', 'aprobaciones.editar',
    'servicios.ver', 'servicios.crear', 'servicios.editar'
  )
  AND NOT EXISTS (
    SELECT 1 FROM `role_has_permissions` rhp
    WHERE rhp.`role_id` = r.`id` AND rhp.`permission_id` = p.`id`
  );
