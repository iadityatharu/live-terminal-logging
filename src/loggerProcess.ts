import chalk from "chalk";

process.title = "Live Logger";

interface LogData {
  method: string;
  url: string;
  status: number;
  time: string;
  timestamp: string;
  body: Record<string, unknown>;
}

class LoggerWorker {
  constructor() {
    this.listenForMessages();
  }

  private listenForMessages() {
    process.on("message", (data: LogData) => {
      try {
        this.handleLog(data);
      } catch (error) {
        console.error(chalk.red("[LoggerWorker Error]:"), error);
      }
    });

    process.on("uncaughtException", (err) => {
      console.error(chalk.red("[Uncaught Exception]"), err);
    });

    process.on("unhandledRejection", (reason) => {
      console.error(chalk.red("[Unhandled Rejection]"), reason);
    });
  }

  private handleLog(data: LogData) {
    const { method, url, status, time, timestamp } = data;

    const color =
      status < 300
        ? chalk.green
        : status < 400
        ? chalk.cyan
        : status < 500
        ? chalk.yellow
        : chalk.red;

    console.log(color(`[${timestamp}] ${method} ${url} ${status} - ${time}ms`));
  }
}
new LoggerWorker();
