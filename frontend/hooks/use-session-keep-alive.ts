"use client";

import { useEffect } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
const CHECK_EVERY_MS = 60_000;

/**
 * Mientras la persona usa el panel, avisa al servidor cada minuto para que
 * renueve la sesión (el servidor decide si toca). Sin actividad no manda nada:
 * así solo se cierra la sesión por inactividad real y no por un tiempo fijo.
 */
export function useSessionKeepAlive(): void {
  useEffect(() => {
    let active = false;
    const markActive = () => {
      active = true;
    };

    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, markActive, { passive: true });
    }

    async function ping() {
      if (!active || document.visibilityState === "hidden") return;
      active = false;

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });
        if (response.status === 401) {
          // La sesión ya expiró (inactividad o tope absoluto): al login. Navegación
          // completa a propósito para descartar el estado en memoria.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login?motivo=sesion";
        }
      } catch {
        // Sin red: se reintenta en el siguiente ciclo si sigue habiendo actividad.
      }
    }

    const timer = window.setInterval(() => void ping(), CHECK_EVERY_MS);
    return () => {
      window.clearInterval(timer);
      for (const name of ACTIVITY_EVENTS) {
        window.removeEventListener(name, markActive);
      }
    };
  }, []);
}
