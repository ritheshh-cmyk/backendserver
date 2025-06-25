import express from 'express';
import { createServer } from 'vite';
import path from 'path';

const app = express();
const port = 5000;

// Create Vite server in middleware mode
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
  root: path.resolve(process.cwd(), 'client'),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
    },
  },
});

app.use(vite.ssrFixStacktrace);
app.use(vite.middlewares);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});