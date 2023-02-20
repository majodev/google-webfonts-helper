import * as request from "supertest";
import { app } from "../app";

describe("GET /-/healthy", () => {
  it("should respond with 200", async () => {
    await request(app)
      .get("/-/healthy")
      .timeout(2000)
      .expect(200)
      .expect("Content-Type", /text\/plain/);
  });
});
