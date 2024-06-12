import express from "express";
import UsuarioControllers from "../controllers/UsuarioControllers.js";
const usuario = express.Router();
import authMidleware from "../middlewares/authMiddleware.js";

// * Rota de criação de conta
usuario.post("/criar-conta", UsuarioControllers.criarConta);

// * Rota de login
usuario.post("/login", UsuarioControllers.login);

// * Rota que valida o token do usuário
usuario.post("/token/validar", authMidleware, UsuarioControllers.validarToken);

// * Rota de carregamento dos itens do carrinho
usuario.get("/conta/carrinho", UsuarioControllers.carregarCarrinho);

// * Rota de adicionar itens no carrinho
usuario.post("/conta/carrinho/adicionar", UsuarioControllers.adicionarProduto);

// * Rota de atualização do produto (aumentar e diminuir a quantidade de itens)
usuario.patch("/conta/carrinho/atualizar", authMidleware, UsuarioControllers.atualizarCarrinho);

// * Rota de delete do produto do carrinho
usuario.delete("/conta/carrinho/remover/:id", authMidleware, UsuarioControllers.removerProdutoDosCarrinhos);

// * Rota de carregamento dos favoritos
usuario.get("/conta/favoritos", authMidleware, UsuarioControllers.carregarFavoritos);

// * Rota de adicionar itens no favoritos
usuario.post("/conta/favoritos/adicionar", authMidleware, UsuarioControllers.adicionarProdutoAosFavoritos);

// * Rota de remover itens do favoritos
usuario.delete("/conta/favoritos/remover/:id", authMidleware, UsuarioControllers.removerProdutoDosFavoritos);

// * Rota de pegar dados da conta do usuário
usuario.get("/conta", authMidleware, UsuarioControllers.carregarConta);

// * Rota de atualizar dados da conta do usuário
usuario.patch("/conta/atualizar", authMidleware, UsuarioControllers.atualizarConta);

// * Rota de confirmar a senha do usuário
usuario.post("/conta/confirmar-senha", authMidleware, UsuarioControllers.confirmarSenha);

// * Rota de alterar a senha do usuário
usuario.post("/conta/alterar-senha", authMidleware, UsuarioControllers.alterarSenha);

export default usuario;
