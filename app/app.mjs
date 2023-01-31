import express, { json } from "express";
import compression from "compression";
import { join } from "path";
import { Environment } from "./environment.mjs";
import { AuthController } from "./controllers/auth-controller.mjs";
import { HttpResponseStatus } from "node-be-core";

class App {
  constructor() {
    this.env = new Environment();
    this.express = express();
    this.express.use(json());
    this.express.use(compression({ filter: this.shouldCompress }));
  }

  async start() {
    try {
      await this.env.start();

      const auth = new AuthController(this.env);
      this.express.use(join(this.env.config.root, auth.route), auth.router);

      this.express.use(join(this.env.config.root, "/healthcheck"), (request, response) => {
        response.send({ uptime: process.uptime() });
      });

      this.express.use(
        /**
         *
         * @param {any} error
         * @param {import("express").Request} request
         * @param {import("express").Response} response
         * @param {import("express").NextFunction} next
         */
        (error, request, response, next) => {
          if (!error) {
            next();
          } else if (error.name === "JsonWebTokenError") {
            this.env.logger.error(error.status, error.message);
            response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
          } else if (error.status && error.status !== HttpResponseStatus.SERVER_ERROR) {
            this.env.logger.error(error.status);
            if (error.errors && error.errors.length) {
              let data = error.errors.map((item) => {
                return item.message;
              });
              response.status(error.status).send(data);
            } else {
              response.sendStatus(error.status);
            }
          } else {
            this.env.logger.error(HttpResponseStatus.SERVER_ERROR, error.stack);
            response.sendStatus(HttpResponseStatus.SERVER_ERROR);
          }
        }
      );

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async end() {
    try {
      await this.env.end();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @returns {boolean}
   */
  shouldCompress(request, response) {
    if (request.headers["x-no-compression"]) {
      // don't compress responses with this request header
      return false;
    }

    // fallback to standard filter function
    return compression.filter(request, response);
  }
}

export { App };
