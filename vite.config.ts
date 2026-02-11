import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { effuse } from "@effuse/compiler/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    effuse({
      debug: false,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "prismjs",
      "prismjs/components/prism-typescript",
      "prismjs/components/prism-bash",
      "prismjs/components/prism-javascript",
      "prismjs/components/prism-jsx",
      "prismjs/components/prism-json",
      "prismjs/components/prism-tsx",
      "prismjs/components/prism-markdown",
      "tagix",
    ],
  },
  build: {
    sourcemap: false,
  },
});
