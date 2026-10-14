const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const fs = require("node:fs");
const path = require("node:path");

function copyDemoFiles() {
  return {
    name: "copy-demo-files",
    closeBundle() {
      const outputDir = path.resolve(__dirname, "../dist");
      fs.mkdirSync(path.join(outputDir, "tracker"), { recursive: true });
      fs.copyFileSync(path.resolve(__dirname, "../demo.html"), path.join(outputDir, "demo.html"));
      fs.copyFileSync(path.resolve(__dirname, "../tracker/tracker.js"), path.join(outputDir, "tracker/tracker.js"));
    }
  };
}

module.exports = defineConfig({
  root: __dirname,
  plugins: [react(), copyDemoFiles()],
  server: { port: 5173 },
  build: { outDir: "../dist", emptyOutDir: true }
});
