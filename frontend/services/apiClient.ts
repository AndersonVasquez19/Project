"use client";

import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Un 401 significa que el token caducó o fue revocado: volvemos al login en
// lugar de dejar al usuario en una pantalla que ya no puede cargar datos.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      // Navegación completa a propósito: descarta la caché de React Query y
      // fuerza la revalidación de la sesión en el servidor. Esto vive fuera de
      // un componente de React, así que no hay `useRouter` disponible.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login?motivo=sesion";
    }

    return Promise.reject(error);
  },
);
