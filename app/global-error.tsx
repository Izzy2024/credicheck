"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
            Error del sistema
          </h2>
          <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
            Ha ocurrido un error critico. Por favor, recarga la pagina.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 24px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Recargar pagina
          </button>
        </div>
      </body>
    </html>
  );
}
