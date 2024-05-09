const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const produtos = require("./routes/produtos");
const cors = require("cors");
const usuario = require("./routes/usuario");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require('dotenv').config()
const sessionKey = process.env.SESSION_KEY
app.use(cookieParser());
app.use(
  session({
    secret: `${sessionKey}`,
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000/", "http://localhost:5173/"],
    // credentials: true,
  })
);
app.use("/", produtos);
app.use("/", usuario);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
