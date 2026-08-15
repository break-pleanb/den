import path from "path"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // frappe-gantt의 package.json exports 필드가 "." 외 서브패스를 막고 있어
      // CSS 파일을 별도로 import하려면 별칭으로 우회해야 한다.
      "frappe-gantt/dist/frappe-gantt.css": path.resolve(
        __dirname,
        "./node_modules/frappe-gantt/dist/frappe-gantt.css",
      ),
    },
  },
})