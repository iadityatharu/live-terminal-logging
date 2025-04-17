import { fork } from "child_process";
import LiveLogger from "../src/index"; // adjust as needed

jest.mock("child_process", () => ({
  fork: jest.fn(() => ({
    send: jest.fn(),
    on: jest.fn(),
  })),
}));

describe("LiveLogger Middleware", () => {
  const mockSend = jest.fn();
  const mockFork = fork as jest.Mock;

  beforeEach(() => {
    mockFork.mockReturnValue({
      send: mockSend,
      on: jest.fn(),
    } as any);
    mockSend.mockClear();
    process.env.NODE_ENV = ""; // non-production
  });

  it("should return a middleware function", () => {
    const logger = new LiveLogger();
    const middleware = logger.middleware();
    expect(typeof middleware).toBe("function");
  });

  it("should fork logger process when not in production", () => {
    new LiveLogger();
    expect(fork).toHaveBeenCalled();
  });

  it("should NOT fork logger process when in production and disabledInProd is true", () => {
    process.env.NODE_ENV = "production";
    new LiveLogger({ disabledInProd: true });
    expect(fork).not.toHaveBeenCalled();
  });

  it("should still fork logger process when in production if disabledInProd is false", () => {
    process.env.NODE_ENV = "production";
    new LiveLogger({ disabledInProd: false });
    expect(fork).toHaveBeenCalled();
  });

  it("should not log if status is below threshold", () => {
    const logger = new LiveLogger({ filterStatusAbove: 400 });
    const middleware = logger.middleware();

    const req = {
      method: "GET",
      originalUrl: "/health",
      body: {},
    } as any;

    const res = {
      statusCode: 200,
      on: (event: string, cb: () => void) => {
        if (event === "finish") cb();
      },
    } as any;

    const next = jest.fn();
    middleware(req, res, next);

    expect(mockSend).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should send log with masked fields when status is above threshold", () => {
    const logger = new LiveLogger({ maskFields: ["secret"] });
    const middleware = logger.middleware();

    const req = {
      method: "POST",
      originalUrl: "/login",
      body: {
        username: "admin",
        secret: "123456",
        nested: {
          secret: "hidden",
        },
      },
    } as any;

    const res = {
      statusCode: 401,
      on: (event: string, cb: () => void) => {
        if (event === "finish") cb();
      },
    } as any;

    const next = jest.fn();
    middleware(req, res, next);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const dataSent = mockSend.mock.calls[0][0];

    expect(dataSent.status).toBe(401);
    expect(dataSent.body.secret).toBe("[MASKED]");
    expect(dataSent.body.nested.secret).toBe("[MASKED]");
    expect(next).toHaveBeenCalled();
  });

  it("should handle errors while sending logs gracefully", () => {
    const logger = new LiveLogger();
    const middleware = logger.middleware();

    const req = {
      method: "GET",
      originalUrl: "/error-test",
      body: { password: "123" },
    } as any;

    const res = {
      statusCode: 500,
      on: (event: string, cb: () => void) => {
        if (event === "finish") cb();
      },
    } as any;

    logger["loggerProcess"] = {
      send: () => {
        throw new Error("Send Failed");
      },
    } as any;

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    middleware(req, res, jest.fn());

    expect(consoleSpy).toHaveBeenCalledWith(
      "[Logger Send Error]:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
