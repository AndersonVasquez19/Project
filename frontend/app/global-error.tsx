"use client";

export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          background: "#F4F7FB",
          color: "#172B3A",
          margin: 0,
        }}
      >
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22 }}>No pudimos cargar la aplicación</h1>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            Ocurrió un error inesperado. Inténtalo de nuevo en unos segundos.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 12,
              border: 0,
              background: "#176B9A",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
