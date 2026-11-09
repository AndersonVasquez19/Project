# Horus API (NestJS + Prisma)

Backend independiente compatible con la base de datos MySQL `horus`. Prisma se usa en modo cliente y la aplicación no ejecuta cambios de esquema automáticamente. Las modificaciones de tablas se documentan como scripts SQL manuales para revisión y aplicación controlada.

## Inicio local

1. Instala dependencias con `npm install`.
2. Proporciona `DATABASE_URL` con una URL `mysql://...` o las variables `DB_HOST`, `DB_PORT`, `DB_DATABASE` (o `DB_NAME`), `DB_USERNAME` (o `DB_USER`) y `DB_PASSWORD`, además de los valores de JWT. No copies credenciales desde archivos `.env` ni guardes secretos en Git.
3. Configura `JWT_SECRET`, `JWT_ISSUER` y `JWT_TTL` para emitir y validar los tokens del sistema. Para conservar sesiones existentes durante la transición, el backend admite el formato de clave `base64:...` y la semántica de versión de token del esquema actual.
4. Verifica la configuración con `npm run build` y ejecuta `npm run start:dev`.

El servicio escucha en `127.0.0.1:4000`. La configuración de MySQL se exige al iniciar (puerto predeterminado `3306`). Tablas Spatie se consultan con SQL parametrizado debido a su relación polimórfica.

La instancia configurada de `horus` estaba vacía y no se encontró un dump de
respaldo en el proyecto. Por eso se creó el esquema base vacío desde
`prisma/schema.prisma` y se aplicaron las dos migraciones SQL manuales. Esto no
restauró matrículas, cursos, usuarios ni otros datos de un sistema anterior:
la base continúa sin datos de negocio. Las migraciones ya aplicadas no deben
volverse a ejecutar manualmente. Como son scripts SQL manuales, no se registran
en la tabla Laravel `migrations`; mantenga este estado en el registro de
despliegue.

## Autenticación

- `POST /api/auth/login` acepta JSON `{ "email": "...", "password": "..." }`.
- Responde con `user`, `access_token`, `token_type` y `expires_in`, compatibles con el BFF de `frontend/`.
- El JWT usa HS256, `iss`/`aud`, `sub`, `iat`, `nbf`, `exp`, `jti` y `ver` compatible con el esquema actual; agrega nombre, correo, rol(es) y permisos para presentación en Next.js.
- `GET /api/auth/me` y `POST /api/auth/logout` requieren `Authorization: Bearer ...`; logout incrementa `users.jwt_version`, revocando los tokens previos.
- El login está limitado a cinco peticiones por minuto por correo normalizado (almacenado en el limitador solo como SHA-256); solicitudes sin correo se limitan por IP. Las credenciales inválidas reciben el mismo mensaje; la contraseña nunca se registra.
- CORS permite por defecto `http://localhost:3000` y `http://127.0.0.1:3000`. Para otros orígenes, configura `CORS_ORIGINS` con una lista separada por comas. No se habilitan cookies cross-origin: Next.js conserva el JWT en su cookie HttpOnly y su BFF llama al backend.

Para el BFF existente, configura `AUTH_API_URL` con el origen de NestJS (por ejemplo, `http://127.0.0.1:4000`). `frontend/services/apiClient.ts` debe seguir llamando al origen Next `/api/auth`, no al backend directamente: así no se expone el JWT HttpOnly.

## Pagos de matrícula

Los abonos se registran como movimientos separados ligados a una matrícula. El backend actualiza el acumulado histórico y marca la matrícula como pagada cuando el saldo llega a cero. `prisma/manual-migrations/20261108_enrollment_payments.sql` ya se aplicó a la instancia configurada; como no había matrículas ni cursos, no se importaron pagos históricos.

El script agrega el precio de la matrícula como snapshot y crea el historial aditivo. Si se usa en otra instancia con datos existentes, cada `monto_pagado` positivo se representa como un único movimiento `historico`; su fecha usa la fecha de matrícula y una nota advierte que no es la fecha real del cobro. El precio histórico se aproxima usando el precio actual del curso. Revise esos datos antes de aplicar el script en cualquier otra base; no se ejecuta desde el backend ni desde el inicio de la aplicación.

`GET /api/reportes/matriculas` entrega el reporte filtrable por fechas, curso y estado, limitado a 10 000 matrículas por solicitud. Requiere `reportes.ver`; los pagos requieren `matriculas.ver` para consulta y `matriculas.editar` para registrar abonos.

Los módulos internos exponen solicitudes de aprobación con resolución de un solo uso y registro en `audit_logs`; notificaciones se limitan a la cuenta autenticada. Configuración solo permite editar una lista cerrada de valores de presentación y no devuelve secretos del servidor. Auditoría muestra eventos sin el contenido potencialmente sensible de los cambios.

`REQUIRE_VERIFIED_EMAIL=true` impide emitir tokens a cuentas sin `email_verified_at`.

## Asistente virtual con Gemini

El asistente se implementa en TypeScript y consume Gemini desde NestJS. Configura
`GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` (por defecto
`gemini-2.5-flash`) en el entorno privado del backend. Nunca uses un prefijo
`NEXT_PUBLIC_` ni envíes la clave al navegador. Sin una clave, el asistente queda
deshabilitado.

Las instrucciones y el arreglo de conocimiento empresarial aprobado se
mantienen en `src/modules/asistente/assistant-instructions.ts` como TypeScript.
Se envían como contexto a Gemini en cada consulta; esto no modifica ni entrena
los parámetros del modelo. El módulo valida `asistente.ver`, limita cada
mensaje a 2000 caracteres y el historial a diez turnos. No persiste
conversaciones ni registra su texto. El conocimiento está vacío inicialmente,
por lo que el asistente debe abstenerse de inventar servicios, precios,
horarios, disponibilidad o políticas de Horus. Las consultas se envían a
Google Gemini; no se incluyen registros de MySQL.

## Permisos de los módulos internos

Los 14 nombres de permisos definidos en
`prisma/manual-migrations/20261109_internal_modules_permissions.sql` ya se
insertaron en la instancia configurada. No se asignaron a roles. Antes de
habilitar módulos para usuarios, un administrador debe asignar explícitamente
los permisos requeridos desde la administración de roles.

La pantalla de respaldos informa que la función todavía no está habilitada.
No se ejecutan exportaciones ni restauraciones: falta definir y validar el
destino privado, la retención, el cifrado y el procedimiento de recuperación.

El asistente Python no forma parte del backend ni es requerido para ejecutar
Horus.
