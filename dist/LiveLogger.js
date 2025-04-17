"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class LiveLogger {
    constructor(options = {}) {
        var _a, _b, _c, _d;
        this.loggerProcess = null;
        this.filterStatusAbove = (_a = options.filterStatusAbove) !== null && _a !== void 0 ? _a : 100;
        this.maskFields = (_c = (_b = options.maskFields) === null || _b === void 0 ? void 0 : _b.map((f) => f.toLowerCase())) !== null && _c !== void 0 ? _c : [
            "password",
            "authorization",
        ];
        this.disabledInProd = (_d = options.disabledInProd) !== null && _d !== void 0 ? _d : true;
        this.isProd = process.env.NODE_ENV === "production";
        if (!(this.isProd && this.disabledInProd)) {
            this.initLoggerProcess();
        }
    }
    initLoggerProcess() {
        try {
            if (!this.loggerProcess) {
                const loggerPath = path_1.default.join(__dirname, "LoggerWorker.js");
                this.loggerProcess = (0, child_process_1.fork)(loggerPath, { execArgv: [] });
                this.loggerProcess.on("error", (err) => {
                    console.error("[Logger Error]:", err);
                    this.loggerProcess = null;
                });
                this.loggerProcess.on("exit", (code, signal) => {
                    console.warn(`[Logger Exit]: code=${code}, signal=${signal}`);
                    this.loggerProcess = null;
                });
            }
        }
        catch (err) {
            console.error("[Logger Init Error]:", err);
            this.loggerProcess = null;
        }
    }
    deepMask(obj) {
        if (typeof obj !== "object" || obj === null)
            return obj;
        const result = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            const value = obj[key];
            if (this.maskFields.includes(key.toLowerCase())) {
                result[key] = "[MASKED]";
            }
            else if (typeof value === "object" && value !== null) {
                result[key] = this.deepMask(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    middleware() {
        if (this.isProd && this.disabledInProd) {
            return (_req, _res, next) => next();
        }
        return (req, res, next) => {
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
                }
                catch (err) {
                    console.error("[Logger Send Error]:", err);
                }
            });
            next();
        };
    }
}
exports.default = LiveLogger;
