// @ts-nocheck
const express = require("express");
const { registerRoutes } = require("./routes.js");
const { setupVite, serveStatic, log } = require("./vite.js");
const { createServer } = require("http");
const { Server: SocketIOServer } = require("socket.io");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/** @type {import('express').RequestHandler} */
const requestLogger = (req, res, next) => {
  /** @type {any} */
  let capturedJsonResponse = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
};
app.use(requestLogger);

(async () => {
  try {
    // Create HTTP server and Socket.IO server
    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: { origin: "*" }, // adjust as needed for production
    });

    // Pass io to registerRoutes (no longer returns a server)
    await registerRoutes(app, io);

    /** @type {(err: any, _req: import('express').Request, res: import('express').Response, _next: Function) => void} */
    const errorHandler = (err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    };
    app.use(errorHandler);

    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    const port = 5000;
    httpServer.listen({
      port,
      host: "127.0.0.1"
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (err) {
    console.error("Fatal error during server startup:", err);
    try {
      console.error("Error (string):", String(err));
      console.error("Error (JSON):", JSON.stringify(err));
    } catch (jsonErr) {
      console.error("Error could not be stringified:", jsonErr);
    }
    process.exit(1);
  }
})();
