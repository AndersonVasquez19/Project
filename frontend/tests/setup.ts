import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Los tests de componentes montan DOM; los de node no tienen document y cleanup es inocuo.
afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup();
  }
});
