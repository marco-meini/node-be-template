"use strict";

import * as express from "express";
import { Environment } from "../environment.mjs";

class Abstract_Controller {
  /**
   * @type {express.Router}
   */
  router;
  /**
   * @type {Environment}
   */
  env;
  /**
   * @type {string}
   */
  route;

  /**
   *
   * @param {Environment} env
   */
  constructor(env, route) {
    this.env = env;
    this.route = route;
    this.router = express.Router();
  }
}

export { Abstract_Controller };
