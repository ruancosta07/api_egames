import express from "express";
import swaggerUi from "swagger-ui-express";
import produtos from "./routes/produtos.js";
import usuario from "./routes/usuario.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import swaggerDocument from "../swagger.json";
import {readFile} from "fs/promises"
const json = JSON.parse(await readFile("./src/swagger.json"))
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
app.use(compression({ level: 3 }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    // origin: ["http://localhost:3000", "http://localhost:5173", "https://ruancosta-egames-2.vercel.app"],
    // credentials: true,
  })
);

// Serve a documentação Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(json));
app.use("/", produtos);
app.use("/", usuario);

async function dbConnect() {
  try {
    const connection = await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sdqptiw.mongodb.net/`
    );
    app.listen(port, () =>
      console.log(`Server running at http://localhost:${port}, conectado ao db`)
    );
  } catch (error) {
    throw error;
  }
}

dbConnect();
