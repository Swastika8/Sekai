import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';

function blogApi(): Plugin {
  async function configure(server: ViteDevServer | PreviewServer) {
    const { createBlogApi } = await import(new URL('../backend/api.mjs', import.meta.url).href);
    const api = createBlogApi();
    server.middlewares.use((request, response, next) => {
      void api.handle(request, response, next);
    });
    server.httpServer?.once('close', api.close);
  }
  return { name: 'sekai-blog-api', configureServer: configure, configurePreviewServer: configure };
}

export default defineConfig({ plugins: [react(), blogApi()] });
