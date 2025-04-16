import { fork, ChildProcess } from "child_process";
import path from "path";
import { Request, Response, NextFunction } from "express";

interface LoggerOptions {
  filterStatusAbove?: number;
  maskFields?: string[];
  disabledInProd?: boolean;
}

let loggerProcess: ChildProcess | null = null;

function liveLogger(options: LoggerOptions = {}) {
  const {
    filterStatusAbove = 100,
    maskFields = ["password", "authorization"],
    disabledInProd = true,
  } = options;

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && disabledInProd) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  if (!loggerProcess) {
    loggerProcess = fork(path.join(__dirname, "logger.js"));
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on("finish", () => {
      if (res.statusCode < filterStatusAbove) return;

      const duration = Date.now() - startTime;

      const safeBody: Record<string, unknown> = { ...req.body };
      maskFields.forEach((field) => {
        if (field in safeBody) {
          safeBody[field] = "[MASKED]";
        }
      });

      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        time: duration.toFixed(2),
        timestamp: new Date().toISOString(),
        body: safeBody,
      };

      loggerProcess?.send(logData);
    });

    next();
  };
}

export = liveLogger;
