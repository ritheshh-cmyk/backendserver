import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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
});

(async () => {
  try {
    // Create HTTP server and Socket.IO server
    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: { origin: "*" }, // adjust as needed for production
    });

    // Pass io to registerRoutes (no longer returns a server)
    await registerRoutes(app, io);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

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
