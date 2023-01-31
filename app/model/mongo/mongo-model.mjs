import { MongoClienManager } from "node-be-core";

class MongoModel {
  /**
   *
   * @param {MongoClienManager} connection
   */
  constructor(connection) {
    /** @type {MongoClienManager} */
    this.connection = connection;
  }
}

export { MongoModel };
