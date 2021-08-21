const app = require("../app");
const request = require("supertest");

describe("GET /", () => {
  test("Returns response of homepage", async () => {
    const response = await request(app).get("/");
    expect(response.body.message).toBe("Welcome to Home Page!");
  });
});
