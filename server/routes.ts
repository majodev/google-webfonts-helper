import * as express from "express";
import { getApiFonts, getApiFontsById } from "./api/fonts.controller";
import { getHealthy } from "./api/healthy.controller";

export function setupRoutes(app: express.Express) {
  app.use("/fonts", express.static(app.get("appPath") + "/index.html"));
  app.use("/fonts/", express.static(app.get("appPath") + "/index.html"));
  app.use("/fonts/:id", express.static(app.get("appPath") + "/index.html"));

  app.route("/api/fonts").get(getApiFonts);

  app.route("/api/fonts/:id").get(getApiFontsById);

  app.route("/-/healthy").get(getHealthy);

  // All undefined asset or api routes should return a 404
  app.route("/:url(-|api|auth|components|app|bower_components|assets)/*").get(function (req, res) {
    res.status(404).send("Not found");
  });

  // All other routes should redirect to the index.html
  app.route("/*").get(function (req, res) {
    res.redirect(req.baseUrl + "/");
  });
}
