-- Usuario de base de datos con permisos mínimos para la API (NO ejecutar como parte de las migraciones).
--
-- Por qué: la API no debe conectarse como `root`. Si hay una inyección SQL o se filtra DATABASE_URL,
-- un usuario limitado no puede borrar tablas, crear usuarios ni leer otras bases de datos.
--
-- Uso (desde una sesión de administración, p. ej. `mysql -u root -p`):
--   1. Sustituye __CAMBIAR_CONTRASENA__ por una contraseña larga y aleatoria, p. ej.:
--        node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
--   2. Ejecuta este archivo.
--   3. Cambia DATABASE_URL en backend/.env:
--        DATABASE_URL=mysql://horus_app:<contraseña url-encoded>@localhost:3306/horus
--   4. Reinicia la API y comprueba que arranca y que el login funciona.
--
-- Las migraciones (`prisma migrate` / `db push` / DDL manual) se siguen ejecutando con una cuenta
-- administradora aparte, nunca con la que usa la aplicación en ejecución.

CREATE USER IF NOT EXISTS 'horus_app'@'localhost' IDENTIFIED BY '__CAMBIAR_CONTRASENA__';

-- Solo datos: sin CREATE, DROP, ALTER, INDEX, GRANT ni FILE.
GRANT SELECT, INSERT, UPDATE, DELETE ON `horus`.* TO 'horus_app'@'localhost';

-- Necesario para `SELECT ... FOR UPDATE` dentro de transacciones (ya incluido en SELECT),
-- pero las tablas de bloqueo implícito no requieren privilegios adicionales.
FLUSH PRIVILEGES;

-- Verificación:
--   SHOW GRANTS FOR 'horus_app'@'localhost';
-- Cuando confirmes que todo funciona, cambia también la contraseña de `root`:
--   ALTER USER 'root'@'localhost' IDENTIFIED BY '<contraseña larga y aleatoria>';
