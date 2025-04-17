import request from "supertest";
import serverInstance from "../src/server"; // Import the server instance

describe("Server", () => {
  it("should respond with Hello, World! on GET /", async () => {
    const response = await request(serverInstance.getApp()) // Using getApp() to get the express app instance
      .get("/")
      .expect("Content-Type", /text\/html/)
      .expect(200);

    expect(response.text).toBe("Hello, World!");
  });

  it("should handle POST /error and log it with status 500", async () => {
    const response = await request(serverInstance.getApp()) // Using getApp() to get the express app instance
      .post("/error")
      .expect("Content-Type", /json/)
      .expect(500);

    expect(response.body.error).toBe("Oops! Something went wrong.");
  });

  it("should handle PATCH /patch and log it with status 200", async () => {
    const response = await request(serverInstance.getApp()) // Using getApp() to get the express app instance
      .patch("/patch")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.message).toBe("Patch request successful!");
  });
});
