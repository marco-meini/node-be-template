import { Abstract_PgModel, Crypt } from "node-be-core";
import { generate } from "randomstring";

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
  async getUserByEmail(username) {
    try {
      let sql = `select *
      from users_us a
      where deleted_us = false
      and email_us =$1`;
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
   * @returns {Promise<IUser>}
   */
  async getUserById(userId) {
    try {
      let sql = `select *
      from users_us a
      where deleted_us = false 
      and id_us=$1`;
      return this.__connection.queryReturnFirst({
        sql: sql,
        replacements: [userId]
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
      let sql = `select gg.code_gr 
      from grants_gr gg 
      inner join users_grants_ug ugu 
        on id_gr = ugu.id_grant_ug 
      where ugu.id_user_ug = $1`;

      let result = await this.__connection.query({ sql: sql, replacements: [userId] });

      return Promise.resolve(result.rows.map((item) => item.code_gr));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {number} userId
   * @param {import("pg").PoolClient} [transactionClient]
   * @returns {Promise<string>}
   */
  async generateNewPassword(userId, transactionClient) {
    try {
      let newPassword = generate(8);
      let hash = await Crypt.hash(newPassword);
      await this.__connection.query({ sql: "update users_us set password_us=$1 where id_us=$2", replacements: [hash, userId], transactionClient: transactionClient });
      return Promise.resolve(newPassword);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * @param {number} userId
   * @param {string} hash
   * @returns {Promise<void>}
   */
  async updatePassword(userId, hash) {
    try {
      let sql = `update users_us set password_us=$1 where id_us=$2`;
      await this.__connection.query({ sql: sql, replacements: [hash, userId] });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

export { Users };
