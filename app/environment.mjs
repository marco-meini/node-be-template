import { Logger, MongoClienManager, PgClientManager, SendGridMailManager, SessionMiddleware } from "node-be-core";
import config from "../config/config.mjs";
import { MongoModel } from "./model/mongo/mongo-model.mjs";
import { PgModel } from "./model/postgres/pg-model.mjs";

/**
 * @typedef {{
 * port: number,
 * db: import("pg").PoolConfig,
 * logLevel: number,
 * root: string,
 * mongo: {
 *  dbconfig: import("./lib/mongo-client-manager.mjs").MongoDbConfig,
 *  options: import("mongodb").MongoClientOptions
 * },
 * session: {
 *  headerName: string,
 *  expiration: number
 * },
 * updateGrantsOnTokenRefresh: boolean,
 * mailManager: {
 *  apiKey: string,
 *  from: string
 * }
 * }} Config
 */

class ExpressError extends Error {
  /** @type {number} */
  status;
}

class Environment {
  /** @type {Config} */
  config;
  /** @type {Logger} */
  logger;
  /** @type {PgModel} */
  pgModel;

  /** @type {MongoModel} */
  mongoModel;
  /** @type {SessionMiddleware} */
  session;
  /** @type {SendGridMailManager} */
  mailManager;

  constructor() {
    this.config = config;
    this.logger = new Logger(this.config.logLevel);
    this.pgModel = new PgModel(new PgClientManager(this.config.db, this.logger.sql.bind(this.logger)));
    this.mailManager = new SendGridMailManager(config.mailManager.apiKey);
  }

  async start() {
    let connection = new MongoClienManager(this.config.mongo.dbconfig, this.config.mongo.options);
    await connection.connect();
    this.mongoModel = new MongoModel(connection);
    this.session = new SessionMiddleware(this.config.session.headerName, this.config.session.expiration, this.mongoModel.connection);
  }

  async end() {
    await this.pgModel.connection.disconnect();
    this.mongoModel.connection.disconnect();
  }
}

export { ExpressError, Environment };
