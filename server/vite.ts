import express, { type Express } from "express";
import fs from "fs";
import path from "path";
// import { createServer } from 'vite'; // Commented out for backend
// import config from '../vite.config'; // Commented out for backend
// import { nanoid } from 'nanoid'; // Commented out for backend
import { createLogger } from "vite";
import { type Server } from "http";
// // // import { nanoid } from "nanoid" // Commented out for backend // Commented out for backend // Commented out for backend;

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Commented out for backend deployment - Vite server not needed
  console.log('Vite setup skipped for backend deployment');
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
