import { defineConfig } from "vite";

export default defineConfig({
  // הבסיס הוא שם ה-Repository שלך
  base: "/DavidProj/",
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    open: true,
  },
});
