import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Handle client-side routing - send index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Development server running on http://0.0.0.0:${port}`);
});