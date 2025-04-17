import { fork } from "child_process";
import LiveLogger from "../src/index"; // Adjust path if necessary

jest.mock("child_process", () => ({
  fork: jest.fn(() => ({
    send: jest.fn(),
    on: jest.fn(),
  })),
}));

describe("LiveLogger Middleware (Class-Based)", () => {
  const mockSend = jest.fn();
  const mockFork = fork as jest.Mock;

  beforeEach(() => {
    mockFork.mockReturnValue({ send: mockSend } as any);
    process.env.NODE_ENV = "";
    mockSend.mockClear();
  });

  it("should return a middleware function", () => {
    const loggerInstance = new LiveLogger();
    const middleware = loggerInstance.middleware();
    expect(typeof middleware).toBe("function");
  });

  it("should not log if status is below filter threshold", () => {
    const loggerInstance = new LiveLogger({ filterStatusAbove: 400 });
    const middleware = loggerInstance.middleware();

    const req = {
      method: "GET",
      originalUrl: "/api/test",
      body: {},
    } as any;

    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === "finish") callback();
      },
    } as any;

    const next = jest.fn();
    middleware(req, res, next);

    expect(mockSend).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should mask fields and send log to logger process", () => {
    const loggerInstance = new LiveLogger({ maskFields: ["password"] });
    const middleware = loggerInstance.middleware();

    const req = {
      method: "POST",
      originalUrl: "/login",
      body: { username: "admin", password: "secret" },
    } as any;

    const res = {
      statusCode: 401,
      on: (event: string, callback: () => void) => {
        if (event === "finish") callback();
      },
    } as any;

    const next = jest.fn();
    middleware(req, res, next);

    expect(mockSend).toHaveBeenCalled();
    const sentData = mockSend.mock.calls[0][0];

    expect(sentData.body.password).toBe("[MASKED]");
    expect(sentData.url).toBe("/login");
    expect(sentData.status).toBe(401);
    expect(next).toHaveBeenCalled();
  });
});
