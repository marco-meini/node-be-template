import { Environment } from "../environment.mjs";
import { Abstract_Controller } from "./abstract-controller.mjs";

class UsersController extends Abstract_Controller {
  /**
   *
   * @param {Environment} env
   */
  constructor(env) {
    super(env, "users");
    this.router.get("/me", this.env.session.checkAuthentication(), this.__getMe.bind(this));
  }

  /**
   *
   * @param {import("node-be-core").SessionRequest} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   */
  async __getMe(request, response, next) {
    try {
      let user = await this.env.pgModel.users.getUserById(request.session.id_user);
      delete user.password_us;
      response.send(user);
    } catch (e) {
      next(e);
    }
  }
}

export { UsersController };
