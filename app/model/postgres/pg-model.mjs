import { PgClientManager } from "node-be-core";
import { Users } from "./users.mjs";

class PgModel {
  /**
   *
   * @param {PgClientManager} connection
   */
  constructor(connection) {
    this.connection = connection;
    this.users = new Users(connection);
  }
}

export { PgModel };
