import { Crypt, Files, HttpResponseStatus, Strings } from "node-be-core";
import { Environment } from "../environment.mjs";
import { Abstract_Controller } from "./abstract-controller.mjs";
import handlebars from "handlebars";
import { join } from "path";
import { readFileSync } from "fs";

class AuthController extends Abstract_Controller {
  /**
   *
   * @param {Environment} env
   */
  constructor(env) {
    super(env, "auth");
    this.router.post("/login", this.__login.bind(this));
    this.router.post("/logout", this.__logout.bind(this));
    this.router.post("/refresh", this.__refresh.bind(this));
    this.router.post("/password-recovery", this.__passwordRecovery.bind(this));
    this.router.post("/password-change", this.env.session.checkAuthentication(), this.__passwordChange.bind(this));
  }

  /**
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   * @returns
   */
  async __login(request, response, next) {
    try {
      /**
       * @type {{
       * email: string,
       * password: string
       * }}
       */
      let _loginData = request.body;
      if (_loginData && _loginData.email && _loginData.password) {
        let _user = await this.env.pgModel.users.getUserByEmail(_loginData.email);
        if (!_user) {
          return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
        } else {
          let _authenticated = await Crypt.validateHash(_loginData.password, _user.password_us);
          if (_authenticated) {
            let _grants = await this.env.pgModel.users.getUserGrants(_user.id_us);
            let _session = await this.env.session.sessionManager.storeNewSession({
              id_user: _user.id_us,
              grants: _grants
            });
            return response.send({
              access_token: _session.access_token,
              refresh_token: _session.refresh_token
            });
          } else {
            return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
          }
        }
      } else {
        return response.sendStatus(HttpResponseStatus.BAD_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   * @returns
   */
  async __logout(request, response, next) {
    try {
      /** @type {{refresh_token:string}} */
      let logoutData = request.body;
      if (logoutData && logoutData.refresh_token) {
        let removed = await this.env.session.sessionManager.removeToken(logoutData.refresh_token);
        return response.sendStatus(removed > 0 ? HttpResponseStatus.OK : HttpResponseStatus.NOT_AUTHENTICATED);
      } else {
        return response.sendStatus(HttpResponseStatus.MISSING_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   * @returns
   */
  async __refresh(request, response, next) {
    try {
      /** @type {{refresh_token:string}} */
      let refreshData = request.body;
      if (refreshData && refreshData.refresh_token) {
        if (!this.env.config.updateGrantsOnTokenRefresh) {
          let deviceSession = await this.env.session.sessionManager.updateDeviceSession(refreshData.refresh_token);
          if (deviceSession) {
            let user = await this.env.pgModel.users.getUserById(deviceSession.user_id);
            if (!user) {
              return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
            } else {
              return response.send({ access_token: deviceSession.access_token });
            }
          } else {
            return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
          }
        } else {
          /** @type {import("node-be-core").ISession} */
          let deviceSession = await this.env.session.sessionManager.getSessionByRefeshToken(refreshData.refresh_token);
          if (deviceSession) {
            let user = await this.env.pgModel.users.getUserById(deviceSession.user_id);
            if (!user) {
              return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
            } else {
              deviceSession.grants = await this.env.pgModel.users.getUserGrants(user.id_us);
              deviceSession = await this.env.session.sessionManager.updateDeviceSessionAndGrants(deviceSession);
              return response.send({ access_token: deviceSession.access_token });
            }
          } else {
            return response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
          }
        }
      } else {
        return response.sendStatus(HttpResponseStatus.BAD_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   */
  async __passwordRecovery(request, response, next) {
    try {
      if (request.body && request.body.email) {
        let tc = await this.env.pgModel.connection.startTransaction();
        try {
          let user = await this.env.pgModel.users.getUserByEmail(request.body.email);
          if (!user) {
            response.sendStatus(HttpResponseStatus.NOT_AUTHENTICATED);
          } else {
            let newPassword = await this.env.pgModel.users.generateNewPassword(user.id_us, tc);
            let templatePath = join(Files.appRoot(), "assets/templates", "ResetPassword.htm");
            let file = readFileSync(templatePath, { encoding: "utf8" });
            let html = handlebars.compile(file)({
              name: user.fullname_us,
              password: newPassword,
              host: request.get("host")
            });
            // send email
            await this.env.mailManager.send({ from: this.env.config.mailManager.from, to: user.email_us, subject: "Reset password", html: html });
            await this.env.pgModel.connection.commit(tc);
            response.send();
          }
        } catch (e) {
          await this.env.pgModel.connection.rollback(tc);
          next(e);
        }
      } else {
        response.sendStatus(HttpResponseStatus.BAD_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   *
   * @param {import("node-be-core").SessionRequest} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   */
  async __passwordChange(request, response, next) {
    try {
      if (request.body && request.body.current_password && request.body.new_password) {
        let user = await this.env.pgModel.users.getUserById(request.session.id_user);
        let authenticated = await Crypt.validateHash(request.body.current_password, user.password_us);
        if (authenticated) {
          if (request.body.new_password !== request.body.current_password && Strings.validatePassword(request.body.new_password)) {
            let crypted = await Crypt.hash(request.body.new_password);
            await this.env.pgModel.users.updatePassword(user.id_us, crypted);
            response.send();
          } else {
            response.sendStatus(HttpResponseStatus.BAD_PARAMS);
          }
        } else {
          response.sendStatus(HttpResponseStatus.NOT_AUTHORIZED);
        }
      } else {
        response.sendStatus(HttpResponseStatus.BAD_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }
}

export { AuthController };
