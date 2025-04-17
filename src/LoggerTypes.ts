export interface LogData {
  method: string;
  url: string;
  status: number;
  time: string;
  timestamp: string;
  body: Record<string, unknown>;
}
