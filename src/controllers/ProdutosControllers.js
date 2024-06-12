import supabaseProducts from "../database/connect.js";
import Produto from "../models/Produto.js";
import jwt from "jsonwebtoken";
import nodeCache from "node-cache";
import dotenv from "dotenv"
import Usuario from "../models/Usuario.js";
dotenv.config()
const myCache = new nodeCache({ stdTTL: 300, checkperiod: 120 });
const jwtKey = process.env.JWT_KEY
// * controller de carregar todos os produtos
const carregarProdutos = async (req, res) => {
  try {
    let produtosCarregados = myCache.get("produtosFetch");
    if (!produtosCarregados) {
      produtosCarregados = await Produto.find({}, [
        "_id",
        "title",
        "images",
        "price",
        "oldPrice",
        "slug",
        "category",
      ]).sort({
        createdAt: "descending",
      });
      produtosCarregados = produtosCarregados.map((item) => {
        let produto = {
          _id: item._id,
          title: item.title,
          images: item.images[0],
          price: item.price,
          oldPrice: item.oldPrice,
          slug: item.slug,
          category: item.category,
        };
        return produto;
      });
      myCache.set("produtosFetch", produtosCarregados);
    }
    res.json(produtosCarregados);
  } catch (error) {
    throw error;
  }
};

// * controller de criar um novo produto
const criarProduto = async (req, res) => {
  const { title, description, price, oldPrice, category } = req.body;
  const dataAtual = Date.now();
  const [, token] = req.headers.authorization.split(" ");
  const decoded = jwt.decode(token, `${jwtKey}`)
  const usuario = await Usuario.findOne({email: decoded.email})

  if(usuario && usuario.role === "admin"){
    const files = req.files;
    let imageUrls = [];  
  for (let file of files) {
    const arrayBufferImage = Uint8Array.from(file.buffer).buffer;

    const { data: uploadedFile, error: uploadError } =
      await supabaseProducts.storage
        .from("products_images")
        .upload(`${dataAtual}-${file.originalname}`, arrayBufferImage, {
          contentType: ["image/jpeg", "image/webp"],
          upsert: false,
        });

    if (uploadError) {
      console.error("Erro ao fazer upload da imagem:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: imageUrl, error: urlError } = supabaseProducts.storage
      .from("products_images")
      .getPublicUrl(`${dataAtual}-${file.originalname}`);

    if (urlError) {
      console.error("Erro ao obter a URL da imagem:", urlError);
      return res.status(500).json({ error: urlError.message });
    }

    imageUrls.push(imageUrl.publicUrl);
  }

  function limpaSlug(str) {
    let mapaAcentosHex = {
      a: /[\xE0-\xE6]/g,
      e: /[\xE8-\xEB]/g,
      i: /[\xEC-\xEF]/g,
      o: /[\xF2-\xF6]/g,
      u: /[\xF9-\xFC]/g,
      c: /\xE7/g,
      n: /\xF1/g,
    };
    for (let letra in mapaAcentosHex) {
      let regex = mapaAcentosHex[letra];
      str = str.replace(regex, letra);
    }

    str = str
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .toLowerCase()
      .replace(/ /g, "-");
    return str;
  }

  const novoProduto = {
    title,
    description,
    price,
    oldPrice,
    category,
    slug: limpaSlug(title),
    images: imageUrls,
  };
  try {
    const produtoSalvo = await new Produto(novoProduto).save();
    return res.json({ message: "Produto criado com sucesso", produtoSalvo });
  } catch (error) {
    throw error;
  }
}
};

// * controller de carregar um produto pelo ID
const carregaProdutoPeloIdeSlug = async (req, res) => {
  const productUrl = req.params.name;
  const id = req.params.id;

  const produto = await Produto.findOne({ _id: id, slug: productUrl });
  if (!produto) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  return res.status(200).json(produto);
};

// * controller de dashboard dos produtos
const produtosDashBoard = async (req, res) => {
  try {
    const [, token] = req.headers.authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    if (decoded.role === "admin") {
      const produtos = await Produto.find().select("_id title slug views");
      res.status(200).json(produtos);
    } else {
      return res
        .status(401)
        .json({ error: "Apenas administradores podem acessar o dashboard" });
    }
  } catch (error) {
    throw error;
  }
};

// * controller de atualizar o views do produto pelo ID
const aumentarViewsDoProduto = async (req, res) => {
  const { id } = req.params;
  const { nome } = req.params;
  try {
    const produto = await Produto.findOne({ _id: id, slug: nome });
    if (produto) {
      const produtoAlterado = await Produto.findOneAndUpdate(
        { _id: id, slug: nome },
        { views: produto.views ? produto.views + 1 : 1 }
      );
      res.json(produtoAlterado);
    }
  } catch (error) {
    throw error;
  }
};

// * controller de adicionar comentario ao produto pelo ID e nome do produto
const adicionarComentario = async function (req, res) {
  const { id } = req.params;
  const { nome } = req.params;
  const { user, comment, title, rate } = req.body;
  const dataAtual = new Date();
  if(user && comment && title && rate){
  try {
    const produto = await Produto.findOne({ _id: id, slug: nome }).select(
      "comments"
    );
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    const comentariosAnteriores = produto.comments;
    const comentario = {
      user,
      comment,
      title,
      rate,
      createdAt: `${dataAtual.getDate()}/${
        dataAtual.getMonth() < 10 && "0" + (dataAtual.getMonth() + 1)
      }/${dataAtual.getFullYear()}`,
    };
    comentariosAnteriores.push(comentario);
    await produto.save();
    res.json(produto.comments);
  } catch (error) {
    throw error;
  }
}
else{
    res.status(400).json({ error: "Campos obrigatórios não informados" });
}
};

// * controller de editar um produto pelo ID
const editarProduto = async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;
  function limpaSlug(str) {
    let mapaAcentosHex = {
      a: /[\xE0-\xE6]/g,
      e: /[\xE8-\xEB]/g,
      i: /[\xEC-\xEF]/g,
      o: /[\xF2-\xF6]/g,
      u: /[\xF9-\xFC]/g,
      c: /\xE7/g,
      n: /\xF1/g,
    };
    for (let letra in mapaAcentosHex) {
      let regex = mapaAcentosHex[letra];
      str = str.replace(regex, letra);
    }

    str = str
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .toLowerCase()
      .replace(/ /g, "-");
    return str;
  }

  try {
    const [, token] = authorization.split(" ");
    const decoded = jwt.verify(token, `${jwtKey}`);
    const produto = await Produto.findOne({ _id: id });
    if (decoded.role === "admin" && produto) {
      const produtoAlterado = await Produto.findOneAndUpdate(
        { _id: id },
        {
          title: req.body.title,
          description: req.body.description,
          price: req.body.price,
          oldPrice: req.body.oldPrice,
          slug: limpaSlug(req.body.title),
          category: req.body.category,
        }
      );
      res.status(200).json({
        message: "Produto atualizado com sucesso",
        produto: produtoAlterado,
      });
    } else {
      return res
        .status(401)
        .json({ error: "Apenas administradores podem editar produtos" });
    }
  } catch (error) {
    return res.status(401).json({ error: "Autorização inválida" });
  }
};

// * objeto do controller de produtos
const ProdutosControllers = {
  carregarProdutos,
  criarProduto,
  carregaProdutoPeloIdeSlug,
  produtosDashBoard,
  aumentarViewsDoProduto,
  editarProduto,
  adicionarComentario,
};

export default ProdutosControllers;
