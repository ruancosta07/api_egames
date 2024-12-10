import express from "express";
import swaggerUi from "swagger-ui-express";
import produtos from "./routes/produtos.js";
import usuario from "./routes/usuario.js";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerJSDoc from "swagger-jsdoc";
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();
app.use(compression({ level: 3 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: "*"
    // credentials: true,
  })
);
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Egames',
      version: '1.0.0',
      description: 'Essa é a documentação da API Egames, um projeto criado por mim voltado para a venda de produtos gamers, resolvi desponibilzar a API para outras pessoas criarem seus projetos com ela ;). Desenvolvido com o Node.js, Express e MongoDB',
      contact: {
        name: 'Ruan Costa',
        url: 'https:ruancostadev.com.br',
        email: 'ruan.costa.ti0805@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api-egames.vercel.app',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Caminho para os arquivos das rotas
};
const swaggerDocument = swaggerJSDoc(options);
// Serve a documentação Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.css'}));
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
