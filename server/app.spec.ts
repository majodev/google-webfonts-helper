import * as request from "supertest";
import { app } from "./app";

describe("GET /api/not_defined", () => {
  it("should respond with 404", async () => {
    await request(app)
      .get("/api/not_defined")
      .timeout(2000)
      .expect(404)
      .expect("Content-Type", /text\/html/);
  });
});

describe("GET /", () => {
  it("should respond with 200", async () => {
    await request(app)
      .get("/")
      .timeout(2000)
      .expect(200)
      .expect("Content-Type", /text\/html/);
  });
});
