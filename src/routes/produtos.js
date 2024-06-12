import express from "express";
import multer from "multer";
import authMidleware from "../middlewares/authMiddleware.js";
import compressImages from "../middlewares/compressImages.js";
import ProdutosControllers from "../controllers/ProdutosControllers.js";
const produtos = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// * Rota de carregar todos os produtos
produtos.get("/produtos", ProdutosControllers.carregarProdutos);

// * Rota de criar um novo produto
produtos.post(
  "/criar-produto",
  upload.array("image"),
  compressImages,
  authMidleware,
  ProdutosControllers.criarProduto
);

// * Rota de carregar um produto pelo ID
produtos.get("/produto/:id/:nome", ProdutosControllers.carregaProdutoPeloIdeSlug);

// * Rota de dashboard dos produtos
produtos.get("/produtos/dashboard", ProdutosControllers.produtosDashBoard);

// * Rota de atualizar o views do produto pelo ID
produtos.post("/produto/:id/:nome", ProdutosControllers.aumentarViewsDoProduto);

// * Rota de adicionar comentario ao produto pelo ID e nome do produto
produtos.post(
  "/produto/comentarios/adicionar/:id/:nome",
  authMidleware,
  ProdutosControllers.adicionarComentario
);

// * Rota de editar um produto pelo ID
produtos.patch(
  "/produtos/editar/:id",
  authMidleware,
  ProdutosControllers.editarProduto
);

export default produtos;
