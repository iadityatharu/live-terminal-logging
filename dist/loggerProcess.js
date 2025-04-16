"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
process.title = "Live Logger";
process.on("message", (data) => {
    const { method, url, status, time, timestamp } = data;
    const color = status < 300
        ? chalk_1.default.green
        : status < 400
            ? chalk_1.default.cyan
            : status < 500
                ? chalk_1.default.yellow
                : chalk_1.default.red;
    console.log(color(`[${timestamp}] ${method} ${url} ${status} - ${time}ms`));
});
