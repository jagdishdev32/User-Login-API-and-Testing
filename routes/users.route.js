const db = require("../db");
const router = require("express").Router();

const { hashPassword, isLoggedIn, verifyToken, getUser } = require("../common");

// METH   GET  /
// DESC   Get all users
// ACCESS private (admin only)
router.get("/", async (req, res) => {
  const token = req.headers.authorization;

  if (token) {
    const verify = await verifyToken(token);

    // If Admin only then pass data
    if (verify.isadmin == true) {
      const data = await db.query("SELECT * FROM users");

      // Hidding Passwords from both user and admin
      const users = data.rows.map((user) => {
        user.password = undefined;
        return user;
      });

      return res.json(users);
    }
  }
  return res.status(401).json({ message: "unauthorized" });
});

// METH   GET  /
// DESC   Get all users
// ACCESS private (admin only)
router.get("/:id", async (req, res) => {
  const token = req.headers.authorization;
  const { id } = req.params;

  if (token) {
    const verify = await verifyToken(token);

    if (verify) {
      // If user is admin or user_id = id
      if (verify.isadmin == true || verify.user_id == id) {
        const users = await getUser(id);
        if (users) {
          return res.status(200).json({ ...users[0], password: undefined });
        }
      }
    }
  }
  return res.status(401).json({ message: "unauthorized" });
});

module.exports = router;
