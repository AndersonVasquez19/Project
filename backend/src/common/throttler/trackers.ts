import { createHash } from 'node:crypto';

function readProperty(source: unknown, key: string): unknown {
  return source !== null && typeof source === 'object'
    ? Reflect.get(source, key)
    : undefined;
}

function clientIp(request: Record<string, unknown>): string {
  const ip = readProperty(request, 'ip');
  return typeof ip === 'string' && ip ? ip : 'unknown';
}

/** Limita por dirección IP del cliente (requiere `trust proxy` tras un proxy). */
export function ipTracker(request: Record<string, unknown>): string {
  return `ip:${clientIp(request)}`;
}

/**
 * Limita por credencial: usuario autenticado si existe sesión; si no, la
 * pareja IP + email. Así un atacante no puede bloquear el login de una víctima
 * desde otra IP, ni probar correos ilimitados desde una sola IP.
 */
export function credentialTracker(request: Record<string, unknown>): string {
  const subject = readProperty(readProperty(request, 'auth'), 'sub');
  if (typeof subject === 'string' && subject) {
    return `user:${subject}`;
  }

  const email = readProperty(readProperty(request, 'body'), 'email');
  if (typeof email === 'string' && email.trim()) {
    const digest = createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
    return `cred:${clientIp(request)}:${digest}`;
  }

  return ipTracker(request);
}
