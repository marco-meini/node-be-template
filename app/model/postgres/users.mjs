import { Abstract_PgModel } from "node-be-core";

/**
 * @typedef {{
 * id_us: number;
 * fullname_us: string;
 * email_us: string;
 * password_us: string;
 * deleted_us: boolean;
 * }} IUser
 */

class Users extends Abstract_PgModel {
  /**
   *
   * @param {string} username
   * @returns {Promise<IUser>}
   */
  async getUserByUsername(username) {
    try {
      let sql = `select *
      from users_us a
      where deleted_us 
      and (fullname_us =$1 or email_us =$1)`;
      return this.__connection.queryReturnFirst({
        sql: sql,
        replacements: [username]
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {number} userId
   * @returns {Promise<Array<string>>}
   */
  async getUserGrants(userId) {
    try {
      // TODO
      return Promise.resolve([]);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { Users };
