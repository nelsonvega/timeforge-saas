import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db-wizard";

// Middleware to log API responses
function logApiMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  let capturedResponse: Record<string, any> | undefined;

  const originalJson = res.json.bind(res);
  res.json = (body, ...args) => {
    capturedResponse = body;
    return originalJson(body, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;

    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

    if (capturedResponse) {
      const serialized = JSON.stringify(capturedResponse);
      logLine += ` :: ${serialized}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
  });

  next();
}

// Error handling middleware
function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
}

const app = express();

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logApiMiddleware);

// App startup logic
(async () => {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('\x1b[33m⚠️  Warning: Could not initialize database. Server will start without database connection.\x1b[0m');
    console.error('\x1b[33m   Please ensure PostgreSQL is running and DATABASE_URL is correct.\x1b[0m\n');
  }

  const server = await registerRoutes(app);

  app.use(errorHandler);

  const isDev = app.get("env") === "development";

  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || 'localhost';

  server.listen(port, host, () => {
    log(`Serving on http://${host}:${port}`);
  });
})();
