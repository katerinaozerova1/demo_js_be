const express = require("express");

const app = express();

function middleware(req, res, next) {
  ; // SL no-op change
  console.log("Middleware called");
}

app.get("/", (req, res) => {
  middleware();

  res.send("Hello World!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});// Non-operational change: updated at Mon Nov 17 20:32:13 UTC 2025
