import { fork, ChildProcess } from "child_process";
import path from "path";
import { Request, Response, NextFunction } from "express";

interface LoggerOptions {
  filterStatusAbove?: number;
  maskFields?: string[];
  disabledInProd?: boolean;
}

class LiveLogger {
  private loggerProcess: ChildProcess | null = null;
  private readonly filterStatusAbove: number;
  private readonly maskFields: string[];
  private readonly disabledInProd: boolean;
  private readonly isProd: boolean;

  constructor(options: LoggerOptions = {}) {
    this.filterStatusAbove = options.filterStatusAbove ?? 100;
    this.maskFields = options.maskFields?.map((f) => f.toLowerCase()) ?? [
      "password",
      "authorization",
    ];
    this.disabledInProd = options.disabledInProd ?? true;
    this.isProd = process.env.NODE_ENV === "production";

    if (!(this.isProd && this.disabledInProd)) {
      this.initLoggerProcess();
    }
  }

  private initLoggerProcess() {
    try {
      if (!this.loggerProcess) {
        const loggerPath = path.join(__dirname, "LoggerWorker.js");
        this.loggerProcess = fork(loggerPath, { execArgv: [] });

        this.loggerProcess.on("error", (err) => {
          console.error("[Logger Error]:", err);
          this.loggerProcess = null;
        });

        this.loggerProcess.on("exit", (code, signal) => {
          console.warn(`[Logger Exit]: code=${code}, signal=${signal}`);
          this.loggerProcess = null;
        });
      }
    } catch (err) {
      console.error("[Logger Init Error]:", err);
      this.loggerProcess = null;
    }
  }

  private deepMask(obj: any): any {
    if (typeof obj !== "object" || obj === null) return obj;

    const result: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      const value = obj[key];
      if (this.maskFields.includes(key.toLowerCase())) {
        result[key] = "[MASKED]";
      } else if (typeof value === "object" && value !== null) {
        result[key] = this.deepMask(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  public middleware() {
    if (this.isProd && this.disabledInProd) {
      return (_req: Request, _res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on("finish", () => {
        if (res.statusCode < this.filterStatusAbove || !this.loggerProcess)
          return;

        const duration = Date.now() - startTime;
        const safeBody = this.deepMask(req.body);

        const logData = {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          time: duration.toFixed(2),
          timestamp: new Date().toISOString(),
          body: safeBody,
        };

        try {
          this.loggerProcess.send(logData);
        } catch (err) {
          console.error("[Logger Send Error]:", err);
        }
      });

      next();
    };
  }
}

export default LiveLogger;
