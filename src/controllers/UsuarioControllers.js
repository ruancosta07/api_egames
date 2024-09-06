import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const jwtKey = process.env.JWT_KEY;
import crypto from "crypto";
import getClientEmail from "../utils/nodemailer.js";
import Produto from "../models/Produto.js";
import Joi from "joi";
// * controller de criar conta
const criarConta = async (req, res) => {
  const { name, email, password } = req.body;
  const newUser = { name, email, password };
  const newUserSchema = Joi.object({
    name: Joi.string().required().min(3),
    email: Joi.string().email({ tlds: false }).required(),
    password: Joi.string().required().min(8),
  });

  const { error } = newUserSchema.validate(newUser);

  if (error) {
    const errors = error.details.map((e) => e.context.key);
    if (errors.includes("email")) {
      return res.status(400).json({ message: "Email inválido" });
    } else if (errors.includes("name")) {
      return res.status(400).json({ message: "Nome inválido" });
    } else if (errors.includes("password")) {
      return res.status(400).json({ message: "Senha inválida" });
    }
  }
  const foundUser = await Usuario.findOne({ email });
  if (foundUser) {
    return res.status(401).json({ message: "Esse email já está cadastrado" });
  }
  const novoUsuario = { name, email, password };
  try {
    const userSalvo = await new Usuario(novoUsuario).save();
    if (!!userSalvo === true) {
      res.json({ message: "Usuário criado com sucesso" });
    }
  } catch (error) {
    throw error;
  }
};

// * controller de login
const login = async (req, res) => {
  const { email, password, } = req.body;
  const usuarioEncontrado = await Usuario.findOne({ email }).select(
    "+password"
  );
  if (!usuarioEncontrado) {
    return res.status(404).json({ error: "Usuário não encontrado" });
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
        role: usuarioEncontrado.role,
      },
      `${jwtKey}`,
      { expiresIn: "100d" }
    );
    res.status(200).json({
      token,
      message: "Usuário logado com sucessso",
      user: {
        id: usuarioEncontrado._id,
        email: usuarioEncontrado.email,
        name: usuarioEncontrado.name,
        role: usuarioEncontrado.role,
      },
      cart: usuarioEncontrado.cart,
      favorites: usuarioEncontrado.favorites,
      preferences: usuarioEncontrado.preferences,
    });
  }
};

// * controller de validar token
const validarToken = async (req, res) => {
  const { authorization } = req.headers;
  const [, token] = authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  const usuario = await Usuario.findOne({ email: decoded.email });
  if (usuario) {
    res.status(200).json({
      user: {
        id: usuario._id,
        email: usuario.email,
        name: usuario.name,
        role: usuario.role,
        adress: usuario.adress,
      },
      cart: usuario.cart,
      favorites: usuario.favorites,
      orders: usuario.orders,
      preferences: usuario.preferences,
    });
  } else {
    res.status(401).json({ error: "Usuário não encontrado" });
  }
};

// * controller de carregar carrinho
const carregarCarrinho = async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(400).json({ error: "Autorização não fornecida" });
  }

  try {
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      res.status(200).json(usuario.cart);
    }
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar carrinho" });
  }
};

// * controller de adicionar produto
const adicionarProduto = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.body;
      const foundproduct = await Produto.findById(id).select(
        "_id title price oldPrice images slug"
      );
      const productWithQuantity = { ...foundproduct.toObject(), quantity: 1 };
      const verificaProdutoAdicionado = usuario.cart.find((p) =>
        foundproduct._id.equals(p._id)
      );
      if (!verificaProdutoAdicionado) {
        usuario.cart.push(productWithQuantity);
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
};

// * controller de atualizar carrinho
const atualizarCarrinho = async (req, res) => {
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
};

const moverItemParaOCarrinho = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    let usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.body;
      const foundProduct = await Produto.findById(id).select(
        "_id title price oldPrice images slug"
      );

      if (foundProduct) {
        const productWithQuantity = { ...foundProduct.toObject(), quantity: 1 };

        const verificaProdutoAdicionado = usuario.cart.some(
          (p) => p._id.toString() === foundProduct._id.toString()
        );

        if (!verificaProdutoAdicionado) {
          usuario = await Usuario.findOneAndUpdate(
            { email: decoded.email },
            {
              $push: { cart: productWithQuantity },
              $pull: { favorites: { _id: foundProduct._id } },
            },
            { new: true }
          );

          if (usuario) {
            return res.status(200).json({
              message: "Produto movido para o carrinho com sucesso",
              cart: usuario.cart,
              favorites: usuario.favorites,
            });
          }
        } else {
          return res.status(403).json({
            error: "Produto já adicionado ao carrinho",
            cart: usuario.cart,
          });
        }
      } else {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
    } else {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
  } catch (error) {
    console.error("Erro ao adicionar produto ao carrinho:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de remover produto do carrinho
const removerProdutoDoCarrinho = async (req, res) => {
  try {
    const [, token] = req.headers.authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.params;
      const verificaProduto = usuario.cart.some((p) => p._id == id);
      if (verificaProduto) {
        const usuario = await Usuario.findOne({ email: decoded.email });
        const carrinhoFiltrado = usuario.cart.filter((item) => item._id != id);
        usuario.cart = carrinhoFiltrado;
        await usuario.save();
        return res.status(200).json(usuario.cart);
      }
    }
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de carregar favoritos
const carregarFavoritos = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) return res.json({ error: "Autorização não fornecida" });
  try {
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const favoritos = usuario.favorites;
      return res.status(200).json(favoritos);
    }
  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de adicionar produto aos favoritos
const adicionarProdutoAosFavoritos = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.body;
      const foundProduct = await Produto.findById(id).select(
        "_id title price oldPrice images slug"
      );
      if (foundProduct) {
        const verificaProduto = usuario.favorites.some((p) =>
          foundProduct._id.equals(p._id)
        );
        if (!verificaProduto) {
          usuario.favorites.push(foundProduct);
          await usuario.save();
          return res.status(200).json(usuario.favorites);
        }
      }

      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  } catch (error) {
    console.error("Erro ao adicionar produto ao favoritos:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de remover produto do carrinho
const removerProdutoDosFavoritos = async (req, res) => {
  try {
    const { id } = req.params;
    const [, token] = req.headers.authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const verificaProduto = usuario.favorites.filter((p) => p._id != id);
      usuario.favorites = verificaProduto;
      await usuario.save();
      return res.status(200).json(usuario.favorites);
    }
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de carregar conta
const carregarConta = async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) return res.json({ error: "Autorização não fornecida" });
  try {
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      return res.status(200).json({
        email: decoded.email,
        name: usuario.name,
        role: usuario.role,
        adress: usuario.adress,
        cart: usuario.cart,
        favorites: usuario.favorites,
        orders: usuario.orders,
      });
    }
  } catch (error) {
    console.error("Erro ao carregar conta:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * controller de atualizar conta
const atualizarConta = async (req, res) => {
  try {
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { name, email, adress, preferences } = req.body;
      if (name) usuario.name = name;
      if (email) usuario.email = email;
      if (adress) usuario.adress = adress;
      if (preferences) usuario.preferences = preferences;
      await usuario.save();
      return res.status(200).json({ message: "Conta atualizada com sucesso" });
    }
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const confirmarEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ error: "Nenhum usuário com esse email" });
    }
    return res.status(200).json({ message: "Email confirmado com sucesso" });
  } catch {
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// * Controller de confirmar senha
const confirmarSenha = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res
        .status(401)
        .json({ error: "Token de autorização não fornecido" });
    }
    const [, token] = authorization.split(" ");
    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, jwtKey);
    const { password } = req.body;

    const usuario = await Usuario.findOne({ email: decoded.email }).select(
      "+password"
    );
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const result = await bcrypt.compare(password, usuario.password);
    if (result) {
      return res.status(200).json({ message: "Senha confirmada com sucesso" });
    } else {
      return res.status(401).json({ error: "Senha incorreta" });
    }
  } catch (error) {
    console.error("Erro ao confirmar senha:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// * Controller de recuperar senha
// const recuperarSenha = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const usuario = await Usuario.findOne({ email }).select("+password");
//     if (!usuario) {
//       return res.status(401).json({ error: "Usuário não autorizado." });
//     }
//     usuario.password = password;
//     await usuario.save();
//     return res.status(200).json({ message: "Senha recuperada com sucesso" });
//   } catch {
//     return res.status(500).json({ error: "Erro interno do servidor" });
//   }
// };

// * Controller de alterar senha
const alterarSenha = async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res
        .status(401)
        .json({ error: "Token de autorização não fornecido" });
    }
    const [, token] = authorization.split(" ");
    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, jwtKey);

    const usuario = await Usuario.findOne({ email: decoded.email }).select(
      "+password"
    );
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Nova senha não fornecida" });
    }

    usuario.password = password;
    await usuario.save();

    return res.status(200).json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const finalizarPedido = async (req, res) => {
  const { authorization } = req.headers;
  const [, token] = authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  const usuario = await Usuario.findOne({ email: decoded.email });
  const { order } = req.body;
  if (usuario) {
    try {
      usuario.orders.push(order);
      await usuario.save();
      return res.status(200).json({
        message: "Pedido finalizado com sucesso",
        orders: usuario.orders,
        cart: usuario.cart,
      });
    } catch {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};

const confirmarPedido = async (req, res) => {
  const { order } = req.body;
  const [, token] = req.headers.authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  const usuario = await Usuario.findOne({ email: decoded.email });
  if (usuario) {
    try {
      const pedidoEncontrado = usuario.orders.find(
        (item) => item.id === order.id
      );
      if (pedidoEncontrado) {
        pedidoEncontrado.status = order.status;
        pedidoEncontrado.paymentMethod = order.paymentMethod;
        pedidoEncontrado.shipAdress = order.shipAdress;
        pedidoEncontrado.orderDate = order.orderDate;
        pedidoEncontrado.shipTax = order.shipTax;
        usuario.orders = usuario.orders.filter(
          (item) => item.id != pedidoEncontrado.id
        );
        usuario.orders.push(pedidoEncontrado);
        usuario.cart = [];
        await usuario.save();
        return res.status(200).json({
          message: "Pedido atualizado com sucesso",
          orders: usuario.orders,
          cart: usuario.cart,
        });
      }
    } catch {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
};

const carregarCompras = async (req, res) => {
  const [, token] = req.headers.authorization.split(" ");
  const decoded = jwt.verify(token, `${jwtKey}`);
  const usuario = await Usuario.findOne({ email: decoded.email });
  if (usuario) {
    return res.status(200).json(usuario.orders.reverse());
  }
};

const enviarEmailConfirmacao = async (req, res) => {
  const { email } = req.body;
  try {
    const foundUser = await Usuario.findOne({ email });
    if (foundUser) {
      const buffer = crypto.randomBytes(4);
      const randomNumber = buffer.readUInt32BE(0) % 1000000;
      const token = randomNumber.toString().padStart(6, "0");
      const expiresAt = Date.now() + 15 * 60 * 1000; // Token válido por 15 minutos

      foundUser.loginToken = token;
      foundUser.loginTokenExpiresAt = Date.now() * 15 * 60 * 1000;
      await foundUser.save();
      const mail = await getClientEmail();
      const message = await mail.sendMail({
        from: { name: "Ruan Costa", address: "ruancosta.ti0805@gmail.com" },
        to: email,
        subject: `Código de verificação única`,
        html: `
        <div style="background-color: #1C1C1C; margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 70%; margin: auto auto 12px auto;">
    <img src="https://dpvbxbfpfnahmtbhcadf.supabase.co/storage/v1/object/public/products_images/game-controller%20(1).svg">
  </div>
        <div style="background-color: #1C1C1C; padding: 1rem; border: 1px solid #36363688; border-radius: 4px; color: #ABABAB; max-width:70%; margin: auto;">
            <h1 style="margin: 0; color: #fff;">Código de recuperação de senha</h1>
            <p style="font-size: 1.15rem;">Você está recebendo este email porque solicitou o envio de um código de para recuperação de senha. Insira o código
                abaixo para trocar sua senha:</p>
            <p style="font-size: 32px;">${foundUser.loginToken}</p>
            <p>Se você não solicitou este email, por favor ignore.</p>
        </div>
    </div>
          `.trim(),
      });

      return res
        .status(200)
        .send({ message: "Email enviado com sucesso", email: foundUser.email });
    }
  } catch (err) {
    console.log(err);
  }
};

const confirmarCodigo = async (req, res) => {
  const { code, email } = req.body;
  try {
    const foundUser = await Usuario.findOne({ email });
    if (foundUser) {
      const codeMatch = foundUser.loginToken === code;
      if (!codeMatch) {
        return res.status(400).json({ message: "Código incorreto" });
      }
      return res.status(200).json({ message: "Código confirmado" });
    }
  } catch (err) {
    console.log(err);
  }
};

const recuperarSenha = async (req, res) => {
  const { password, code, email } = req.body;
  try {
    const foundUser = await Usuario.findOne({ email });
    if (foundUser && code === foundUser.loginToken) {
      foundUser.password = password;
      await foundUser.save();
      return res.status(200).json({ message: "Senha alterada com sucesso" });
    }
  } catch (err) {
    console.log(err);
  }
};

const excluirConta = async (req, res) => {
  const { email, password } = req.body;
  try {
    const foundUser = await Usuario.findOne({ email }).select("+password");
    if (!foundUser) {
      return res.status(400).json({ message: "Email ou senha incorretos" });
    }
    const passwordMatch = await bcrypt.compare(password, foundUser.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Email ou senha incorretos" });
    }
    await foundUser.deleteOne();
    return res.status(202).json({ message: "Conta excluída com sucesso" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// * objeto dos controllers do usuário
const UsuarioControllers = {
  criarConta,
  login,
  validarToken,
  carregarCarrinho,
  adicionarProduto,
  atualizarCarrinho,
  carregarFavoritos,
  adicionarProdutoAosFavoritos,
  removerProdutoDosFavoritos,
  removerProdutoDoCarrinho,
  carregarConta,
  atualizarConta,
  confirmarEmail,
  confirmarSenha,
  alterarSenha,
  recuperarSenha,
  finalizarPedido,
  confirmarPedido,
  moverItemParaOCarrinho,
  carregarCompras,
  enviarEmailConfirmacao,
  confirmarCodigo,
  excluirConta,
};

export default UsuarioControllers;
