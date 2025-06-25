import { defineConfig } from 'vite';
export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: [
            '68b60832-bfbe-49fc-8d66-bf56a1b38c56-00-1k535ykx4530y.picard.replit.dev'
        ]
    },
});
