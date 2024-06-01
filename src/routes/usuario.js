const usuario = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const authMidleware = require("../middlewares/authMiddleware");
require("dotenv").config();
const jwtKey = process.env.JWT_KEY;

// * Rota de criação de conta
usuario.post("/criar-conta", async (req, res) => {
  const { name, email, password } = req.body;
  const erros = {};
  if (!name) {
    erros.name = "Nome é obrigatório";
  }
  if (!email) {
    erros.email = "Email é obrigatório";
  }
  if (!password) {
    erros.password = "Senha é obrigatória";
  }
  if (erros.name || erros.email || erros.password) {
    return res.status(400).json(erros);
  } else {
    const findUser = await Usuario.findOne({ email });
    if (!!findUser === true) {
      res.status(401).json({ error: "Esse email já está cadastrado" });
    } else {
      const novoUsuario = { name, email, password };
      try {
        const userSalvo = await new Usuario(novoUsuario).save();
        if (!!userSalvo === true) {
          res.json({ message: "Usuário criado com sucesso" });
        }
      } catch (error) {
        throw error;
      }
    }
  }
});

// * Rota de login
usuario.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const usuarioEncontrado = await Usuario.findOne({ email }).select(
    "+password"
  );
  if (!usuarioEncontrado) {
    return res.status(401).json({ error: "Email ou senha inválidos" });
  }
  if (usuarioEncontrado) {
    const result = await bcrypt.compare(password, usuarioEncontrado.password);
    if (!result) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }
    const token = jwt.sign(
      {
        id: usuarioEncontrado._id,
        email: usuarioEncontrado.email,
        name: usuarioEncontrado.name,
        role: usuarioEncontrado.role
      },
      `${jwtKey}`,
      { expiresIn: "1d" }
    );
    res.status(200).json({ token, message: "Usuário logado com sucessso" });
  }
});

// * Rota que valida o token do usuário
usuario.post("/token/validar", authMidleware, async (req, res) => {
  const { authorization } = req.headers;
  const [, token] = authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  res.status(200).json({ user: { email: decoded.email, name: decoded.name } });
});

// * Rota de carregamento dos itens do carrinho
usuario.get("/conta/carrinho", authMidleware, async (req, res) => {
  const { authorization } = req.headers;

  if(!authorization){
    res.status(400).json({error: "Autorização não fornecida"})
  }

    try{
      const [, token] = authorization.split(" ");
      const decoded = jwt.verify(token, `${jwtKey}`);
      const usuario = await Usuario.findOne({ email: decoded.email });
      if(usuario){
        res.status(200).json(usuario.cart);
      }
    }
    catch(error){
      res.status(500).json({error: 'Erro ao carregar carrinho'})
    }
  
});


// * Rota de adicionar itens no carrinho
usuario.post("/conta/carrinho/adicionar", authMidleware, async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const {
        productTitle,
        price,
        oldPrice,
        productLink,
        srcImg,
        description,
        category,
        quantity,
        id,
      } = req.body;
      const novoProduto = {
        productTitle,
        price,
        oldPrice,
        productLink,
        srcImg,
        description,
        quantity,
        category,
        id,
      };
      const verificaProdutoAdicionado = usuario.cart.some(
        (p) => p.id === novoProduto.id
      );
      if (verificaProdutoAdicionado == false) {
        usuario.cart.push(novoProduto);
        await usuario.save();
        return res.status(200).json({
          message: "Produto adicionado ao carrinho com sucesso",
          cart: usuario.cart,
        });
      } else {
        return res.status(403).json({
          message: "Produto já adicionado ao carrinho",
          cart: usuario.cart,
        });
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar produto ao carrinho:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// * Rota de atualização do produto (aumentar e diminuir a quantidade de itens)
usuario.post("/conta/carrinho/atualizar", authMidleware, async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id, quantity } = req.body;
      const produtoCarrinho = usuario.cart.find((item) => item.id == id);
      if (produtoCarrinho) {
        const updatedCart = usuario.cart.map((item) =>
          item.id == id ? { ...item, quantity: quantity } : item
        );
        usuario.cart = updatedCart;
        await usuario.save();
        console.log(usuario.cart);
        res.status(200).json({
          message: "Carrinho atualizado com sucesso",
          cart: usuario.cart,
        });
      } else {
        res.status(404).send("Produto não encontrado no carrinho");
      }
    } else {
      res.status(404).send("Usuário não encontrado");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro interno do servidor");
  }
});

// * Rota de delete do produto do carrinho
usuario.delete("/conta/carrinho/remover/", authMidleware, async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.body;
      const verificaProduto = usuario.cart.some((p) => p.id == id);
      if (verificaProduto) {
        const usuario = await Usuario.findOne({ email: decoded.email });
        const carrinhoFiltrado = usuario.cart.filter((item) => item.id != id);
        usuario.cart = carrinhoFiltrado;
        await usuario.save();
        return res.status(200).json(usuario.cart);
      }
    }
  } catch (error) {
    console.error("Erro ao remover produto ao carrinho:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = usuario;
