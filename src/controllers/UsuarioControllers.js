import Usuario from "../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const jwtKey = process.env.JWT_KEY;

// * controller de criar conta
const criarConta = async (req, res) => {
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
};

// * controller de login
const login = async (req, res) => {
  const { email, password } = req.body;
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
        orders: usuarioEncontrado.orders,
      },
      `${jwtKey}`,
      { expiresIn: "1d" }
    );
    res.status(200).json({ token, message: "Usuário logado com sucessso" });
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
      user: { email: usuario.email, name: usuario.name, role: usuario.role },
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
        quantity: 1,
        category,
        id,
      };
      const verificaProdutoAdicionado = usuario.cart.some(
        (p) => p.id === novoProduto.id
      );
      if (verificaProdutoAdicionado === false) {
        usuario = await Usuario.findOneAndUpdate(
          { email: decoded.email, 'cart.id': { $ne: novoProduto.id } },
          {
            $push: { cart: novoProduto },
            $set: { favorites: [] }
          },
          { new: true }
        );
        if (usuario) {
          return res.status(200).json({
            message: "Produtos movidos para o carrinho com sucesso",
            cart: usuario.cart,
            favorites: usuario.favorites
          });
        } else {
          return res.status(403).json({
            error: "Produto já adicionado ao carrinho",
            cart: usuario.cart,
          });
        }
      } else {
        return res.status(403).json({
          error: "Produto já adicionado ao carrinho",
          cart: usuario.cart,
        });
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
    const { productTitle, price, oldPrice, productLink, srcImg, category, id } =
      req.body;
    const novoProduto = {
      productTitle,
      productLink,
      price,
      oldPrice,
      srcImg,
      category,
      id,
    };
    const { authorization } = req.headers;
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const usuario = await Usuario.findOne({ email: decoded.email });
    if (usuario) {
      const { id } = req.body;
      const verificaProduto = usuario.favorites.some((p) => p.id == id);
      if (!verificaProduto) {
        usuario.favorites.push(novoProduto);
        await usuario.save();
        return res.status(200).json(usuario.favorites);
      }
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
      const verificaProduto = usuario.favorites.filter((p) => p.id != id);
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
      const { name, email, adress } = req.body;
      if (name) usuario.name = name;
      if (email) usuario.email = email;
      if (adress) usuario.adress = adress;
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
const recuperarSenha = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ email }).select("+password");
    if (!usuario) {
      return res.status(401).json({ error: "Usuário não autorizado." });
    }
    usuario.password = password;
    await usuario.save();
    return res.status(200).json({ message: "Senha recuperada com sucesso" });
  } catch {
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

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
      console.log(pedidoEncontrado);
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
  moverItemParaOCarrinho
};

export default UsuarioControllers;
