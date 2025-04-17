"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const LiveLogger_1 = __importDefault(require("./LiveLogger"));
class Server {
    constructor() {
        this.PORT = 3000;
        this.app = (0, express_1.default)();
        this.configureMiddleware();
        this.defineRoutes();
        this.startServer();
    }
    configureMiddleware() {
        this.app.use(express_1.default.json());
        const logger = new LiveLogger_1.default({
            filterStatusAbove: 100,
            maskFields: ["password"],
            disabledInProd: false,
        });
        this.app.use(logger.middleware());
    }
    defineRoutes() {
        this.app.get("/", (_req, res) => {
            res.status(200).send("Hello, World!");
        });
        this.app.post("/error", (_req, res) => {
            res.status(500).json({ error: "Oops! Something went wrong." });
        });
        this.app.patch("/patch", (_req, res) => {
            res.status(200).json({ message: "Patch request successful!" });
            return;
        });
    }
    startServer() {
        this.app.listen(this.PORT, () => {
            console.log(`🚀 Server running at http://localhost:${this.PORT}`);
        });
    }
    // Expose the app for testing purposes (direct access to the app instance)
    getApp() {
        return this.app;
    }
}
// Create the server instance but don't export it directly
const serverInstance = new Server();
exports.default = serverInstance;
