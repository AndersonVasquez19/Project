# Horus frontend

Aplicación administrativa desarrollada con Next.js. Se comunica con la API
NestJS del directorio `backend` y no depende de Laravel ni de un sitio externo.

## Desarrollo local

Configura `AUTH_API_URL` en el entorno del servidor Next.js con el origen de la
API (por ejemplo, `http://127.0.0.1:4000`). El frontend entrega los datos de
autenticación mediante rutas BFF y conserva el JWT en una cookie `HttpOnly`.
Las credenciales de MySQL solo pertenecen al backend; nunca las expongas al
navegador ni a variables `NEXT_PUBLIC_*`.

```powershell
npm install
npm run dev
```

El proxy `/admin` funciona como protección de navegación basada en la cookie.
El layout del servidor decodifica el JWT para presentar identidad y navegación;
esas reclamaciones pueden estar desactualizadas y no son una autorización. Toda
operación protegida debe validarse en NestJS.

## Funcionalidad

Las pantallas administrativas disponibles incluyen cursos, estudiantes,
matrículas, historial de pagos y abonos, servicios tecnológicos, roles y
usuarios. Los cambios de roles invalidan los JWT existentes del usuario
afectado. El backend aplica reglas de permisos, capacidad de cursos y pagos
dentro de transacciones.

Reportes permite filtrar matrículas por fecha, curso y estado, y exportar la
vista a Excel (.xlsx) o PDF.

También se incluyen búsqueda global limitada a los módulos autorizados,
notificaciones personales, solicitudes de aprobación, configuración segura y
consulta de auditoría con los detalles sensibles omitidos. El asistente virtual
se sirve mediante NestJS y FastAPI: su token de servicio permanece en el
backend, requiere el permiso `asistente.ver` y no conserva el historial al salir
de la pantalla. Las consultas se procesan por Gemini desde el backend; la clave
no llega al navegador. El conocimiento se limita a las instrucciones
configuradas en TypeScript y el asistente no debe inventar datos del negocio.
La sección de respaldos explica los requisitos pendientes; no exporta ni
restaura información mientras no exista un destino y un procedimiento de
recuperación validados.

La aplicación está planteada para uso interno. Las cuentas son administradas
por el sistema; no se ofrecen registro público ni enlaces a un sitio Laravel.
Los cambios de esquema de MySQL deben revisarse y ejecutarse de manera
controlada, conservando los datos existentes. La cuenta de pagos requiere que
se aplique la migración manual documentada en `backend/README.md`.
