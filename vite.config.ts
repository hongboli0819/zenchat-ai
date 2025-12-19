import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 子项目入口别名（指向源码，开发模式下直接引用）
      "@org/zip-folder-extractor": path.resolve(
        __dirname,
        "./packages/zip-folder-extractor/src/core/index.ts"
      ),
      "@internal/xlsx-data-importer": path.resolve(
        __dirname,
        "./packages/xlsx-data-importer/src/core/index.ts"
      ),
      "@muse/image-compressor": path.resolve(
        __dirname,
        "./packages/image-compressor/src/core/index.ts"
      ),
      // Tiffany Landing 子项目
      "@tiffany/landing": path.resolve(
        __dirname,
        "./packages/tiffany-landing/src/core/index.ts"
      ),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
