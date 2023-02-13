require("source-map-support").install();

import * as express from "express";
import * as http from "http"
import * as path from "path";
import * as _ from "lodash";
import { setupRoutes } from "./routes";
import { config } from "./config";
import { initStore } from "./logic/store";

export const app = express();

(async () => {
  const server = http.createServer(app);
  server.timeout = config.TIMEOUT_MS;

  const env = app.get('env');

  // http://expressjs.com/en/api.html
  app.set("x-powered-by", false);

  if (config.ENABLE_MIDDLEWARE_COMPRESSION) {
    app.use(require('compression')());
  }

  if (env === 'production') {
    app.use(express.static(path.join(config.ROOT, 'public')));
    app.set('appPath', config.ROOT + '/public');
    if (config.ENABLE_MIDDLEWARE_ACCESS_LOG) {
      app.use(require('morgan')(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]'));
    }
  } else {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.ROOT, '.tmp')));
    app.use(express.static(path.join(config.ROOT, 'client')));
    app.set('appPath', config.ROOT + '/client');
    app.use(require('morgan')('dev'));
    app.use(require('errorhandler')()); // Error handler - has to be last
  }

  setupRoutes(app);

  await initStore();

  // Start server
  server.listen(config.PORT, config.IP, function () {
    console.log('Express server listening on %d, in %s mode (timeout=%dms, compress=%s, accesslog=%s)',
      config.PORT, app.get('env'), server.timeout, config.ENABLE_MIDDLEWARE_COMPRESSION, config.ENABLE_MIDDLEWARE_ACCESS_LOG);
  });

  process.once('SIGINT', function () {
    console.log('SIGINT received, closing server...');
    server.close();
  });

  process.once('SIGTERM', function () {
    console.log('SIGTERM received, closing server...');
    server.close();
  });

})();
