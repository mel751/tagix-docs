import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { effuse } from "@effuse/compiler/vite";
import { resolve } from "path";
import { execSync } from "child_process";
import { version } from "./node_modules/tagix/package.json";

const getReleaseDate = () => {
  try {
    return execSync(`npm view tagix@${version} time.modified`).toString().trim();
  } catch (e) {
    console.warn("Failed to fetch release date for tagix:", e);
    return new Date().toISOString();
  }
};

const releaseDate = getReleaseDate();

export default defineConfig({
  define: {
    __TAGIX_RELEASE_DATE__: JSON.stringify(releaseDate),
  },
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
