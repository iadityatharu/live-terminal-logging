import express, { Application, Request, Response } from "express";
import LiveLogger from "./LiveLogger";

class Server {
  private app: Application;
  private readonly PORT: number = 3000;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.defineRoutes();
    this.startServer();
  }

  private configureMiddleware(): void {
    this.app.use(express.json());

    const logger = new LiveLogger({
      filterStatusAbove: 100,
      maskFields: ["password"],
      disabledInProd: false,
    });

    this.app.use(logger.middleware());
  }

  private defineRoutes(): void {
    this.app.get("/", (_req: Request, res: Response) => {
      res.status(200).send("Hello, World!");
    });

    this.app.post("/error", (_req: Request, res: Response) => {
      res.status(500).json({ error: "Oops! Something went wrong." });
    });
    this.app.patch("/patch", (_req: Request, res: Response) => {
      res.status(200).json({ message: "Patch request successful!" });
      return;
    });
  }

  private startServer(): void {
    this.app.listen(this.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${this.PORT}`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

const serverInstance = new Server();

export default serverInstance;
