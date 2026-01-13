import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        //allowedHosts: ['192.168.1.181'],
        port: 5173,
        proxy: {
            // Proxy all requests starting with /api to localhost:8000
            '/api': {
                target: 'http://localhost:8003',
                changeOrigin: true,
                secure: false,
                ws: false, // Enable WebSocket proxying (helps with SSE)
            },
            '/ws': {
                target: 'http://localhost:8003',
                changeOrigin: true,
                secure: false,
                ws: true, // Enable WebSocket proxying (helps with SSE)
            }
        }
    }
})
