const usuario = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
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
    res.status(200).json({ token });
  }
});

module.exports = usuario;
