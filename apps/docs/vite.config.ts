import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@sokkay/react-gantt/styles.css",
        replacement: fileURLToPath(new URL("../../packages/react-gantt/dist/styles.css", import.meta.url)),
      },
      {
        find: "@sokkay/react-gantt",
        replacement: fileURLToPath(new URL("../../packages/react-gantt/src/index.ts", import.meta.url)),
      },
    ],
  },
});
