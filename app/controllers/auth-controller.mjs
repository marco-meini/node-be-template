"use strict";

import { Crypt, HttpResponseStatus } from "node-be-core";
import { Environment } from "../environment.mjs";
import { Abstract_Controller } from "./abstract-controller.mjs";

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
       * username: string,
       * password: string
       * }}
       */
      let _loginData = request.body;
      if (_loginData && _loginData.username && _loginData.password) {
        let _user = await this.env.pgModel.users.getUserByUsername(_loginData.username);
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
            return this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHENTICATED);
          }
        }
      } else {
        return this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      }
    } catch (e) {
      next(e);
    }
  }

  /**
   * @typedef {object} LogoutData
   * @property {string} refresh_token
   *
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   * @returns
   */
  async __logout(request, response, next) {
    try {
      // /** @type {LogoutData} */
      // let logoutData = request.body;
      // if (logoutData && logoutData.refresh_token) {
      //   let removed = await this.env.session.sessionManager.removeToken(logoutData.refresh_token);
      //   this.env.sendResponse(request, response, removed > 0 ? HttpResponseStatus.OK : HttpResponseStatus.NOT_AUTHENTICATED);
      // } else {
      //   this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      // }
    } catch (e) {
      next(e);
    }
  }

  /**
   * @typedef {object} RefreshData
   * @property {string} refresh_token
   *
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   * @returns
   */
  async __refresh(request, response, next) {
    try {
      // /** @type {RefreshData} */
      // let refreshData = request.body;
      // if (refreshData && refreshData.refresh_token) {
      //   if (this.env.config.updateGrantsOnTokenRefresh) {
      //     let deviceSession = await this.env.session.sessionManager.updateDeviceSession(refreshData.refresh_token);
      //     if (deviceSession) {
      //       let user = await this.env.pgModels.users.getUserById(deviceSession.user_id);
      //       if (user && user.blocked_us) {
      //         return this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHORIZED);
      //       } else {
      //         this.env.sendResponse(request, response, HttpResponseStatus.OK, {
      //           access_token: deviceSession.access_token
      //         });
      //       }
      //     } else {
      //       return this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHENTICATED);
      //     }
      //   } else {
      //     /** @type {import("common-mjs").DeviceSession} */
      //     let deviceSession = await this.env.session.sessionManager.getSessionByRefeshToken(refreshData.refresh_token);
      //     if (deviceSession) {
      //       let user = await this.env.pgModels.users.getUserById(deviceSession.user_id);
      //       if (user && user.blocked_us) {
      //         return this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHORIZED);
      //       } else {
      //         let grants = await this.env.pgModels.users.getUserGrants(user.id_us);
      //         deviceSession.grants = grants ? grants.map((item) => item.code_gr) : [];
      //         deviceSession.features = {
      //           [FEATURES.TIMECARDS]: user.enabled_punching_us
      //         };
      //         deviceSession = await this.env.session.sessionManager.updateDeviceSessionAndGrants(deviceSession);
      //         this.env.sendResponse(request, response, HttpResponseStatus.OK, {
      //           access_token: deviceSession.access_token
      //         });
      //       }
      //     } else {
      //       return this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHENTICATED);
      //     }
      //   }
      // } else {
      //   return this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      // }
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
      // if (request.body && request.body.username_email) {
      //   let tc = await this.env.connection.startTransaction();
      //   try {
      //     let user = await this.env.pgModels.users.getUserForPasswordRecovery(request.body.username_email, tc);
      //     if (user && user.blocked_us) {
      //       this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHORIZED);
      //     } else if (!user) {
      //       this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHENTICATED);
      //     } else {
      //       let newPassword = await this.env.pgModels.users.generateNewPassword(user.id_us, tc);
      //       await this.env.pgModels.users.sendPasswordRecoveryEmail(user, request.get("host"), newPassword, this.env.config.sparkpost.api);
      //       this.env.connection.commit(tc);
      //       this.env.sendResponse(request, response, HttpResponseStatus.OK);
      //     }
      //   } catch (e) {
      //     try {
      //       await this.env.connection.rollback(tc);
      //     } catch (e) {
      //       this.env.logger.error(e);
      //     }
      //     next(e);
      //   }
      // } else {
      //   this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      // }
    } catch (e) {
      next(e);
    }
  }

  /**
   *
   * @param {import("common-mjs").MobileSessionRequest} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   */
  async __passwordChange(request, response, next) {
    try {
      // if (request.body && request.body.current_password && request.body.new_password) {
      //   let user = await this.env.pgModels.users.getUserById(request.session.user_id);
      //   if (user.blocked_us) {
      //     this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHORIZED);
      //   } else {
      //     let authenticated = await Crypt.validateHash(request.body.current_password, user.password_us);
      //     if (authenticated) {
      //       if (request.body.new_password !== request.body.current_password && Strings.validatePassword(request.body.new_password)) {
      //         let crypted = await Crypt.hash(request.body.new_password);
      //         await this.env.pgModels.users.updatePassword(user.id_us, crypted);
      //         this.env.sendResponse(request, response, HttpResponseStatus.OK);
      //       } else {
      //         this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      //       }
      //     } else {
      //       this.env.sendResponse(request, response, HttpResponseStatus.NOT_AUTHORIZED);
      //     }
      //   }
      // } else {
      //   this.env.sendResponse(request, response, HttpResponseStatus.MISSING_PARAMS);
      // }
    } catch (e) {
      next(e);
    }
  }
}

export { AuthController };
