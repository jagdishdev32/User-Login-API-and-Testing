const db = require("../db");
const router = require("express").Router();

const {
  hashPassword,
  isLoggedIn,
  verifyToken,
  getUser,
  updateUser,
} = require("../common");

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

// METH   GET  /:id
// DESC   Get user info
// ACCESS private (admin or same user only)
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

// METH   patch  /:id
// DESC   Update user info
// ACCESS private (admin or same user only)
router.patch("/:id", async (req, res) => {
  const token = req.headers.authorization;
  const { id } = req.params;

  const { username, password } = req.body;

  if (token) {
    const verify = await verifyToken(token);

    if (verify) {
      if (verify.isadmin == true || verify.user_id == id) {
        if (username || password) {
          const user = await updateUser(id, username, password);
          return res.status(201).json({ ...user });
          // return res.status(201).json(user);
        }
        return res
          .status(200)
          .json({ message: "username or password is required" });
      }
    }
  }
  return res.status(401).json({ message: "unauthorized" });
});

// METH   patch  /:id
// DESC   Update user info
// ACCESS private (admin or same user only)
router.delete("/:id", async (req, res) => {
  const token = req.headers.authorization;
  const { id } = req.params;

  if (token) {
    const verify = await verifyToken(token);

    if (verify) {
      if (verify.isadmin == true || verify.user_id == id) {
        // return res.json({ ...verify, id: id });
        // Deleting User
        const user = await db.query(
          "DELETE FROM users WHERE id=$1 RETURNING *",
          [id]
        );
        // return res.json(user.rows);
        if (user.rows.length > 0) {
          // Cannot send data after 204 status
          // return res.status(204).json({ message: "Deleted..." });
          return res.status(200).json({ message: "Deleted..." });
        }
        return res.status(200).json({ message: "Invalid Id" });
      }
    }
  }
  return res.status(401).json({ message: "unauthorized" });
});

module.exports = router;
