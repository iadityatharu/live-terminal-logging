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

process.on("message", (data: LogData) => {
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
});
