import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },

  test: {
    environment: "node",
    globals: true,
    setupFiles: ["reflect-metadata"],
  },
});
