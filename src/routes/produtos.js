import express from "express";
import multer from "multer";
import authMidleware from "../middlewares/authMiddleware.js";
import compressImages from "../middlewares/compressImages.js";
import ProdutosControllers from "../controllers/ProdutosControllers.js";
const produtos = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Produto:
 *       type: object
 *       required:
 *         - title
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: O ID do produto
 *         title:
 *           type: string
 *           description: O nome do produto
 *         price:
 *           type: number
 *           description: O preço do produto
 *         oldPrice:
 *           type: number
 *           description: O preço antigo do produto
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             description: Lista de URLs das imagens do produto
 *         slug:
 *           type: string
 *           description: O slug do produto (nome do produto no formato de URL)
 *         comments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: Nome do usuário que comentou o produto
 *               comment:
 *                 type: string
 *                 description: Comentário do usuário
 *               title:
 *                 type: string
 *                 description: Título do comentário
 *               rate:
 *                 type: number
 *                 description: Avaliação do comentário
 *               createdAt:
 *                 type: string
 *                 description: Data e hora do comentário
 *       example:
 *         _id: 664560f07a921db839f5fa02
 *         title: Headset Gamer
 *         price: 138.99
 *         oldPrice: 158.99
 *         images:
 *           - https://link-img-example.com
 *           - https://link-img-example.com
 *         slug: headset-gamer-redragon
 *         comments:
 *           - user: João Silva
 *             comment: O produto é muito bom
 *             title: Headset Gamer
 *             rate: 5
 *             createdAt: 21-05-2024
 *           - user: Maria Silva
 *             comment: Produto mediano
 *             title: Headset Gamer
 *             rate: 3
 *             createdAt: 21-05-2024
 *     Dashboard:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           _id:
 *             type: string
 *             description: O ID do produto
 *           title:
 *             type: string
 *             description: O nome do produto
 *           slug:
 *             type: string
 *             description: O slug do produto
 *           views:
 *             type: number
 *             description: O número de visualizações do produto
 *       example:
 *         - _id: 664560f07a921db839f5fa02
 *           title: Headset Gamer
 *           slug: headset-gamer-redragon
 *           views: 10
 */

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: API para gerenciar produtos
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Retorna a lista de todos os produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: A lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produto'
 */

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

/**
 * @swagger
 * /produto/{id}/{slug}:
 *   get:
 *     summary: Retorna um produto pelo ID e pelo slug
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do produto
 *         required: true
 *         schema:
 *           type: string
 *       - name: slug
 *         in: path
 *         description: Slug do produto
 *         required: true
 *         schema:
 *           type: string
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Produto retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       404:
 *         description: Produto não encontrado
 */

// * Rota de carregar um produto pelo ID
produtos.get("/produto/:id/:slug", ProdutosControllers.carregaProdutoPeloIdeSlug);

/**
 * @swagger
 * /produto/{id}/{slug}:
 *   post:
 *     tags: [Produtos]
 *     summary: Atualiza as views do produto pelo ID
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do produto
 *         required: true
 *         schema:
 *           type: string
 *       - name: slug
 *         in: path
 *         description: Nome do produto
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retornado com sucesso
 */ 

// * Rota de atualizar o views do produto pelo ID
produtos.post("/produto/:id/:slug", ProdutosControllers.aumentarViewsDoProduto);

/** 
 * @swagger
 * /produto/comentarios/adicionar/{id}/{slug}:
 *   post:
 *     tags: [Produtos]
 *     summary: Adiciona comentário ao produto pelo ID e nome do produto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do produto
 *         required: true
 *         schema:
 *           type: string
 *       - name: slug
 *         in: path
 *         description: Nome do produto
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: Nome do usuário que comentou o produto
 *               comment:
 *                 type: string
 *                 description: Comentário do usuário que comentou o produto
 *               title:
 *                 type: string
 *                 description: Título do produto
 *               rate:
 *                 type: number
 *                 description: Valor do comentário do usuário que comentou o produto
 *               createdAt:
 *                 type: string
 *                 description: Data e hora do comentário do usuário que comentou o produto
 *     responses:
 *       200:
 *         description: Retornado com sucesso
*/

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
