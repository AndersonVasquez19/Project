import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // server-only lanza fuera de un bundle de servidor de Next; en tests no aplica.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    // Node por defecto; los tests de componentes declaran "@vitest-environment jsdom".
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["tests/setup.ts"],
  },
});
