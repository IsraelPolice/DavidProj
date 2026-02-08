import { defineConfig } from "vite";

export default defineConfig({
  // הבסיס חייב להיות שם ה-Repository ב-GitHub עם סלאשים משני הצדדים
  base: "/DavidProj/",
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // מבטיח שהנתיבים לקבצי ה-JS וה-CSS יהיו יחסיים
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    open: true,
  },
});
