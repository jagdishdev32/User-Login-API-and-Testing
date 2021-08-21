const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const TOKEN_SECRET = process.env.TOKEN_SECRET;

module.exports = {
  hashPassword: async (plainPassword) => {
    const hashedPassword = await bcrypt.hash(plainPassword, 1);
    return hashedPassword;
  },
  generateToken: async (user_id, isadmin) => {
    const token = await jwt.sign({ user_id, isadmin }, TOKEN_SECRET);
    return token;
  },
  verifyToken: async (token) => {
    try {
      const verify = await jwt.verify(token, TOKEN_SECRET);
      return verify;
      //   if (verify) {
      //     return true;
      //   }
      //   return false;
    } catch (error) {
      return false;
    }
  },
  decodeToken: async (token) => {
    try {
      const decodedToken = await jwt.decode(token, TOKEN_SECRET);
      return decodedToken;
    } catch (error) {
      return error;
    }
  },
  isLoggedIn: async (token) => {
    const verify = this.verifyToken(token);
    if (verify) {
      return verify;
    }
  },
  getUsers: async () => {
    const user = await db.query("SELECT * FROM users");
    return user.rows;
  },
  getUser: async (id) => {
    const user = await db.query("SELECT * FROM users WHERE id=$1", [id]);
    return user.rows;
  },
  updateUser: async (id, username, password) => {
    let user, hashedPassword;
    //TODO replace manual hash change to change with function
    hashedPassword = await bcrypt.hash(password, 1);

    if (username && password) {
      // hashedPassword = await this.hashPassword(password);
      user = await db.query(
        "UPDATE users SET username=$1, password=$2 where id=$3 RETURNING *",
        [username, hashedPassword, id]
      );
    } else if (username) {
      user = await db.query(
        "UPDATE users SET username=$1 where id=$2 RETURNING *",
        [username, id]
      );
    } else if (password) {
      // hashedPassword = await this.hashPassword(password);
      user = await db.query(
        "UPDATE users SET password=$1 where id=$2 RETURNING *",
        [hashedPassword, id]
      );
    }

    return user.rows[0];
  },
};
