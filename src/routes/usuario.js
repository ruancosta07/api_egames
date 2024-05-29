const usuario = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const authMidleware = require("../middlewares/authMiddleware");
require("dotenv").config();
const jwtKey = process.env.JWT_KEY;

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
      },
      `${jwtKey}`,
      { expiresIn: "1d" }
    );
    res.status(200).json({ token, message: 'Usuário logado com sucessso' });
  }
});

usuario.post("/token/validar", authMidleware, async (req, res) => {
  const { authorization } = req.headers;
  const [, token] = authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  res.status(200).json({ user: { email: decoded.email, name: decoded.name } });
});

usuario.post("/conta/carrinho", authMidleware, async (req, res) => {
  const { authorization } = req.headers;
  const [, token] = authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  const resposta = await Usuario.findOne({ email: decoded.email });
  res.json(resposta.cart);
});

usuario.post("/conta/carrinho/adicionar", authMidleware, async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const quantity = usuario.cart.quantity
      const {
        productTitle,
        price,
        oldPrice,
        productLink,
        srcImg,
        description,
        category,
        id
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
        id
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
        // const carrinhoQuantidadeAumentada = [...user.cart, {quantity: quantity + 1}]
        return res.status(200).json({
          message: "Produto adicionado ao carrinho com sucesso",
          cart: [...usuario.cart, { quantity: quantity + 1 }],
        });
        res.status(401).json({ error: "Esse produto já está no seu carrinho" });
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar produto ao carrinho:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});
usuario.post("/conta/carrinho/remover", authMidleware, async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
    const {id} = req.body
      const verificaProduto = usuario.cart.some((p)=> p.id == id)
      if(verificaProduto){
        const usuario = await Usuario.findOne({email: decoded.email})
       const carrinhoFiltrado = usuario.cart.filter((item)=> item.id != id)
        usuario.cart = carrinhoFiltrado
        await usuario.save()
        return res.status(200).json(usuario.cart)
      }
    }
  } catch (error) {
    console.error("Erro ao remover produto ao carrinho:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

module.exports = usuario;
