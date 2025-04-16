"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
let loggerProcess = null;
function liveLogger(options = {}) {
    const { filterStatusAbove = 100, maskFields = ["password", "authorization"], disabledInProd = true, } = options;
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && disabledInProd) {
        return (_req, _res, next) => next();
    }
    if (!loggerProcess) {
        loggerProcess = (0, child_process_1.fork)(path_1.default.join(__dirname, "loggerProcess.js"));
    }
    return (req, res, next) => {
        const startTime = Date.now();
        res.on("finish", () => {
            if (res.statusCode < filterStatusAbove)
                return;
            const duration = Date.now() - startTime;
            const safeBody = Object.assign({}, req.body);
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
            loggerProcess === null || loggerProcess === void 0 ? void 0 : loggerProcess.send(logData);
        });
        next();
    };
}
module.exports = liveLogger;
