// @ts-nocheck
const express = require("express");
const fs = require("fs");
const path = require("path");
// import { createServer } from 'vite'; // Commented out for backend
// import config from '../vite.config'; // Commented out for backend
// import { nanoid } from 'nanoid'; // Commented out for backend
const { createLogger } = require("vite");
const { typeServer } = require("http");
// // // import { nanoid } from "nanoid" // Commented out for backend // Commented out for backend // Commented out for backend;

const viteLogger = createLogger();

function log(message, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

async function setupVite(app, server) {
  // Commented out for backend deployment - Vite server not needed
  console.log('Vite setup skipped for backend deployment');
}

function serveStatic(app) {
  const distPath = path.resolve(__dirname, "public");

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

module.exports = { log, setupVite, serveStatic };
