const express = require("express");
const app = express();

// Support for Environment Variables
require("dotenv").config({
  path: "./.config.env",
});

// Home Page
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to Home Page!" });
});

// Middle wares
const usersRouter = require("./routes/users.route");
app.use("/api/users", usersRouter);

module.exports = app;
