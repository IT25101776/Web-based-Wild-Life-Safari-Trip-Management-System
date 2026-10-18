import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    // Allow local/LAN access plus ngrok's public hostnames.
    // Keeping this explicit is safer than allowedHosts: true.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
    proxy: {
      // One public ngrok tunnel is enough. Browser requests stay same-origin
      // and Vite forwards API traffic to the local Spring Boot backend.
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      },
      // Package images uploaded by the backend are served from /uploads/.
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
