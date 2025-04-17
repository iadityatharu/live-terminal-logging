"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
process.title = "Live Logger";
class LoggerWorker {
    constructor() {
        this.listenForMessages();
    }
    listenForMessages() {
        process.on("message", (data) => {
            try {
                this.handleLog(data);
            }
            catch (error) {
                console.error(chalk_1.default.red("[LoggerWorker Error]:"), error);
            }
        });
        process.on("uncaughtException", (err) => {
            console.error(chalk_1.default.red("[Uncaught Exception]"), err);
        });
        process.on("unhandledRejection", (reason) => {
            console.error(chalk_1.default.red("[Unhandled Rejection]"), reason);
        });
    }
    handleLog(data) {
        const { method, url, status, time, timestamp } = data;
        const color = status < 300
            ? chalk_1.default.green
            : status < 400
                ? chalk_1.default.cyan
                : status < 500
                    ? chalk_1.default.yellow
                    : chalk_1.default.red;
        console.log(color(`[${timestamp}] ${method} ${url} ${status} - ${time}ms`));
    }
}
new LoggerWorker();
