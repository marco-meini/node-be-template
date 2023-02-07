"use strict";

import { expect } from "chai";
import { App } from "../app/app.mjs";
import { agent } from "supertest";
import { join } from "path";
import config from "./config.mjs";
import _ from "lodash";

const app = new App();
const request = agent(app.express);
const apiRootPath = join(app.env.config.root, "auth");

var refreshToken = "";
var accessToken = "";

describe("Authentication test", () => {
  beforeAll(async () => {
    try {
      await app.start();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  });

  afterAll(async () => {
    try {
      await app.end()
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  });

  it("Login", async () => {
    let response400 = await request.post(join(apiRootPath, "login"));
    expect(response400.status).to.be.equal(400);
    let response400_1 = await request.post(join(apiRootPath, "login")).send({
      email: "test"
    });
    expect(response400_1.status).to.be.equal(400);
    let response401 = await request.post(join(apiRootPath, "login")).send({
      email: "test",
      password: "test"
    });
    expect(response401.status).to.be.equal(401);
    let responseOk = await request.post(join(apiRootPath, "login")).send({
      email: config.users.test.email,
      password: config.users.test.password
    });

    expect(responseOk.status).to.be.equal(200);
    expect(responseOk.body).to.haveOwnProperty("access_token");
    expect(responseOk.body).to.haveOwnProperty("refresh_token");
    refreshToken = responseOk.body.refresh_token;
  });

  it("Refresh token", async () => {
    let response400 = await request.post(join(apiRootPath, "refresh"));
    expect(response400.status).to.be.equal(400);
    let response401 = await request.post(join(apiRootPath, "refresh")).send({
      refresh_token: "test"
    });
    expect(response401.status).to.be.equal(401);
    let responseOk = await request.post(join(apiRootPath, "refresh")).send({
      refresh_token: refreshToken
    });
    expect(responseOk.status).to.be.equal(200);
    expect(responseOk.body).to.haveOwnProperty("access_token").that.ok.is.not.equal(accessToken);
    accessToken = responseOk.body.access_token;
  });

  it("Password change", async () => {
    let response401 = await request.post(join(apiRootPath, "password-change"));
    expect(response401.status).to.be.equal(401);

    request.set(app.env.config.session.headerName, `Bearer ${accessToken}`);

    let response400 = await request.post(join(apiRootPath, "password-change"));
    expect(response400.status).to.be.equal(400);

    let response403 = await request.post(join(apiRootPath, "password-change")).send({
      new_password: "abcd",
      current_password: "qwerty"
    });
    expect(response403.status).to.be.equal(403);

    let response400_1 = await request.post(join(apiRootPath, "password-change")).send({
      new_password: "abcd",
      current_password: config.users.test.password
    });
    expect(response400_1.status).to.be.equal(400);

    let responseOK = await request.post(join(apiRootPath, "password-change")).send({
      new_password: "Abcde.123!!",
      current_password: config.users.test.password
    });
    expect(responseOK.status).to.be.equal(200);

    let responseOK_1 = await request.post(join(apiRootPath, "password-change")).send({
      new_password: config.users.test.password,
      current_password: "Abcde.123!!"
    });
    expect(responseOK_1.status).to.be.equal(200);
  });

  it("Logout", async () => {
    let response400 = await request.post(join(apiRootPath, "logout"));
    expect(response400.status).to.be.equal(400);
    let responseOk = await request.post(join(apiRootPath, "logout")).send({
      refresh_token: refreshToken
    });
    expect(responseOk.status).to.be.equal(200);
    let response401 = await request.post(join(apiRootPath, "logout")).send({
      refresh_token: refreshToken
    });
    expect(response401.status).to.be.equal(401);
  });
});
