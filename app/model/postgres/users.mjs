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
}

export { Users };
