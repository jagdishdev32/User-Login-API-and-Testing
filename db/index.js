const Pool = require("pg").Pool;
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 8081,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "secret",
  database: process.env.NODE_ENV ? "studentstest" : "students",
});
module.exports = pool;
