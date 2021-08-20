const express = require("express");
const app = express();

require("dotenv").config({
  path: "./.config.env",
});

app.get("/", (req, res) => {
  return res.status(200).send("Welcome to Home Page!");
});

module.exports = app;
