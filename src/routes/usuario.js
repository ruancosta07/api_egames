import express from "express";
import UsuarioControllers from "../controllers/UsuarioControllers.js";
const usuario = express.Router();
import authMidleware from "../middlewares/authMiddleware.js";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Carrinho:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           _id:
 *             type: string
 *             description: O ID do produto
 *           productTitle:
 *             type: string
 *             description: Nome do produto
 *           productLink:
 *             type: string
 *             description: Link do produto
 *           image:
 *             type: string
 *             description: URL da imagem do produto
 *           price:
 *             type: number
 *             description: Preço do produto
 *           oldPrice:
 *             type: number
 *             description: Preço antigo do produto
 *           quantity:
 *             type: number
 *             description: Quantidade do produto
 *       example:
 *         - _id: 664560f07a921db839f5fa02
 *           productTitle: Headset Gamer
 *           productLink: /664560f07a921db839f5fa02/headset-gamer-redragon
 *           image: https://link-img-example.com/linkImg
 *           price: 138.99
 *           oldPrice: 159.99
 *           quantity: 1
 *         - _id: 664560f07a921db839f5fa03
 *           productTitle: Mouse Gamer
 *           productLink: /664560f07a921db839f5fa02/headset-gamer-redragon
 *           image: https://link-img-example.com/linkImg2
 *           price: 59.99
 *           oldPrice: 69.99
 *           quantity: 1
 *     Favoritos:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           _id:
 *             type: string
 *             description: O ID do produto
 *           title:
 *             type: string
 *             description: Nome do produto
 *           slug:
 *             type: string
 *             description: Slug do produto
 *           image:
 *             type: string
 *             description: URL da imagem do produto
 *           price:
 *             type: number
 *             description: Preço do produto
 *           oldPrice:
 *             type: number
 *             description: Preço antigo do produto
 *       example:
 *         - _id: 664560f07a921db839f5fa02
 *           title: Headset Gamer
 *           slug: headset-gamer-redragon
 *           image: https://link-img-example.com/linkImg
 *           price: 138.99
 *           oldPrice: 159.99
 *         - _id: 664560f07a921db839f5fa03
 *           title: Mouse Gamer
 *           slug: mouse-gamer-redragon
 *           image: https://link-img-example.com/linkImg2
 *           price: 59.99
 *           oldPrice: 69.99
 */

/** 
 * @swagger
 * /usuario/criar-conta:
 *   post:
 *     tags: [Usuario]
 *     summary: Cria uma conta de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *               nome:
 *                 type: string
 *                 description: Nome do usuário
 *     responses:
 *       200:
 *         description: Conta criada com sucesso
 */

// * Rota de criação de conta
usuario.post("/criar-conta", UsuarioControllers.criarConta);

/**
 * @swagger
 * /usuario/login:
 *   post:
 *     tags: [Usuario]
 *     summary: Login do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Usuário logado com sucesso
 *       401:
 *         description: Email ou senha inválidos 
 *       404:
 *         description: Usuário não encontrado
 */

// * Rota de login
usuario.post("/login", UsuarioControllers.login);

/**
 * @swagger
 * /usuario/token/validar:
 *   post:
 *     tags: [Usuario]
 *     summary: Valida o token do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *       401:
 *         description: Token inválido
 */

// * Rota que valida o token do usuário
usuario.post("/token/validar", authMidleware, UsuarioControllers.validarToken);

/**
 * @swagger
 * /usuario/carrinho:
 *   get:
 *     tags: [Usuario]
 *     summary: Carrega o carrinho do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrinho carregado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrinho'
 *       401:
 *         description: Token inválido
 */

// * Rota de carregamento dos itens do carrinho
usuario.get("/conta/carrinho", UsuarioControllers.carregarCarrinho);

/**
 * @swagger
 * /conta/carrinho/adicionar:
 *   post:
 *     tags: [Usuario]
 *     summary: Adiciona um produto ao carrinho
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID do produto
 *               productTitle:
 *                 type: string
 *                 description: Título do produto
 *               price:
 *                 type: number
 *                 description: Preço do produto
 *               oldPrice:
 *                 type: number
 *                 description: Preço antigo do produto
 *               productLink:
 *                 type: string
 *                 description: Link do produto
 *               srcImg:
 *                 type: string
 *                 description: Link da imagem do produto
 *               description:
 *                 type: string
 *                 description: Descrição do produto
 *               category:
 *                 type: string
 *                 description: Categoria do produto
 *               quantity:
 *                 type: number
 *                 description: Quantidade do produto
 *     responses:
 *       200:
 *         description: Produto adicionado ao carrinho com sucesso
 */

// * Rota de adicionar itens no carrinho
usuario.post("/conta/carrinho/adicionar", UsuarioControllers.adicionarProduto);

/**
 * @swagger
 * /conta/carrinho/atualizar:
 *   patch:
 *     tags: [Usuario]
 *     summary: Atualiza a quantidade de itens no carrinho, podendo aumentar ou diminuir a quantidade de um item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID do produto
 *               quantity:
 *                 type: number
 *                 description: Quantidade do produto
 *           example:
 *             id: 664560f07a921db839f5fa02
 *             quantity: 2
 *     responses:
 *       200:
 *         description: Carrinho atualizado com sucesso
 */

// * Rota de atualização do produto (aumentar e diminuir a quantidade de itens)
usuario.patch("/conta/carrinho/atualizar", authMidleware, UsuarioControllers.atualizarCarrinho);

/**
 * @swagger
 * /conta/carrinho/remover/{id}:
 *   delete:
 *     tags: [Usuario]
 *     summary: Remover um produto do carrinho
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID do produto
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto removido do carrinho com sucesso
 */

// * Rota de delete do produto do carrinho
usuario.delete("/conta/carrinho/remover/:id", authMidleware, UsuarioControllers.removerProdutoDoCarrinho);

/**
 * @swagger
 * /conta/favoritos:
 *   get:
 *     tags: [Usuario]
 *     summary: Carrega os favoritos do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favoritos carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Favoritos'
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */

// * Rota de carregamento dos favoritos
usuario.get("/conta/favoritos", authMidleware, UsuarioControllers.carregarFavoritos);

/**
 * @swagger
 * /conta/favoritos/adicionar:
 *   post:
 *     tags: [Usuario]
 *     summary: Adiciona um produto aos favoritos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID do produto
 *               productTitle:
 *                 type: string
 *                 description: Título do produto
 *               price:
 *                 type: number
 *                 description: Preço do produto
 *               oldPrice:
 *                 type: number
 *                 description: Preço antigo do produto
 *               productLink:
 *                 type: string
 *                 description: Link do produto
 *               srcImg:
 *                 type: string
 *                 description: Link da imagem do produto
 *     responses:
 *       200:
 *         description: Produto adicionado aos favoritos com sucesso
 */

// * Rota de adicionar itens nos favoritos
usuario.post("/conta/favoritos/adicionar", authMidleware, UsuarioControllers.adicionarProdutoAosFavoritos);

/**
 * @swagger
 * /conta/favoritos/remover/{id}:
 *   delete:
 *     tags: [Usuario]
 *     summary: Remover um produto dos favoritos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID do produto
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto removido dos favoritos com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

// * Rota de remover itens dos favoritos
usuario.delete("/conta/favoritos/remover/:id", authMidleware, UsuarioControllers.removerProdutoDosFavoritos);

/**
 * 
 * @swagger
 * /conta:
 *   get:
 *     tags: [Usuario]
 *     summary: Carrega os dados do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário carregados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Nome do usuário
 *                 email:
 *                   type: string
 *                   description: Email do usuário
 *                 adress:
 *                   type: object
 *                   properties:
 *                     cep:
 *                       type: number
 *                       description: CEP do usuário
 *                     logradouro:
 *                       type: string
 *                       description: Rua do usuário
 *                     bairro:
 *                       type: string
 *                       description: Bairro do usuário
 *                     cidade:
 *                       type: string
 *                       description: Cidade do usuário
 *                     estado:
 *                       type: string
 *                       description: Estado do usuário
 *                     complemento:
 *                       type: string
 *                       description: Complemento do endereço
 *                     numero:
 *                       type: string
 *                       description: Número do endereço 
 *            
 */

// * Rota de pegar dados da conta do usuário
usuario.get("/conta", authMidleware, UsuarioControllers.carregarConta);

/**
 * @swagger
 * /conta/atualizar:
 *   patch:
 *     tags: [Usuario]
 *     summary: Atualiza as informações do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               adress:
 *                 type: object
 *                 properties:
 *                   cep:      
 *                     type: number
 *                     description: CEP do usuário
 *                   logradouro:
 *                     type: string
 *                     description: Rua do usuário
 *                   bairro:
 *                     type: string
 *                     description: Bairro do usuário
 *                   cidade:
 *                     type: string
 *                     description: Cidade do usuário
 *                   estado:
 *                     type: string
 *                     description: Estado do usuário
 *                   complemento:
 *                     type: string
 *                     description: Complemento do endereço
 *                   numero:
 *                     type: string
 *                     description: Número do endereço 
 *     responses:
 *       200:
 *         description: Dados do usuário atualizados com sucesso
 */

// * Rota de atualizar dados da conta do usuário
usuario.patch("/conta/atualizar", authMidleware, UsuarioControllers.atualizarConta);

/**
 * @swagger
 * /conta/confirmar-senha:
 *   post:
 *     tags: [Usuario]
 *     summary: Confirma a senha do usuário, para redirecionar para a página de alterar a senha no frontend
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               senha:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Senha confirmada com sucesso
 *       401:
 *         description: Senha inválida
 *       404:
 *         description: Usuário não encontrado
 */

// * Rota de confirmar a senha do usuário
usuario.post("/conta/confirmar-senha", authMidleware, UsuarioControllers.confirmarSenha);

/**
 * @swagger
 * /conta/alterar-senha:
 *   post:
 *     tags: [Usuario]
 *     summary: Altera a senha do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               senhaAntiga:
 *                 type: string
 *                 description: Senha antiga do usuário
 *               senhaNova:
 *                 type: string
 *                 description: Nova senha do usuário
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       401:
 *         description: Senha inválida
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

// * Rota de alterar a senha do usuário
usuario.post("/conta/alterar-senha", authMidleware, UsuarioControllers.alterarSenha);

export default usuario;
