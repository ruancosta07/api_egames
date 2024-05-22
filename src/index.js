const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const produtos = require("./routes/produtos");
const cors = require("cors");
const usuario = require("./routes/usuario");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const compression = require("compression");
const { default: mongoose } = require("mongoose");
require("dotenv").config();
const sessionKey = process.env.SESSION_KEY;
app.use(compression({ level: 3 }));
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
    origin: ["http://localhost:3000", "http://localhost:5173", "https://ruancosta-egames-2.vercel.app/"],
    credentials: true,
  })
);
app.use("/", produtos);
app.use("/", usuario);

async function dbConnect() {
  try{
    const connection = await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sdqptiw.mongodb.net/`
    );
    app.listen(port, () => console.log(`Server running at http://localhost:${port}, conectado ao db`))
  }catch(error){
    throw error
  }
}

dbConnect()
