import express from "express";
import swaggerUi from "swagger-ui-express";
import produtos from "./routes/produtos.js";
import usuario from "./routes/usuario.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { readFile } from "fs/promises";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
try {
  const json = JSON.parse(await readFile(new URL("./swagger.json", import.meta.url)));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(json));
} catch (error) {
  console.error("Erro ao carregar o arquivo swagger.json:", error);
}

// Rotas
app.use("/", produtos);
app.use("/", usuario);

// Conectar ao banco de dados e iniciar o servidor
async function dbConnect() {
  try {
    const connection = await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sdqptiw.mongodb.net/`
    );
    console.log("Conectado ao banco de dados");
    app.listen(port, () =>
      console.log(`Server running at http://localhost:${port}`)
    );
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    process.exit(1);
  }
}

dbConnect();

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});
