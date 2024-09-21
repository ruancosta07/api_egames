import supabaseProducts from "../database/connect.js";
import Produto from "../models/Produto.js";
import jwt from "jsonwebtoken";
import nodeCache from "node-cache";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
const myCache = new nodeCache({ stdTTL: 60, checkperiod: 60 });
const jwtKey = process.env.JWT_KEY;
// * controller de carregar todos os produtos
const carregarProdutos = async (req, res) => {
  try {
    const produtos = await Produto.find()
      .select(
        "_id title images price oldPrice category section slug views comments tags description"
      )
      .sort({
        createdAt: "descending",
      });
      return res.status(200).json(produtos)
  } catch (error) {
    throw error;
  }
};

// * controller de criar um novo produto
const criarProduto = async (req, res) => {
  const { title, description, price, oldPrice, section, category } = req.body;
  const dataAtual = Date.now();
  // const [, token] = req.headers.authorization.split(" ");
  // const decoded = jwt.decode(token, `${jwtKey}`);
  // const usuario = await Usuario.findOne({ email: decoded.email });
  if (true) {
    const files = req.files;
    let imageUrls = [];
    for (let file of files) {
      const arrayBufferImage = Uint8Array.from(file.buffer).buffer;

      const { data: uploadedFile, error: uploadError } =
        await supabaseProducts.storage
          .from("products_images")
          .upload(`${dataAtual}-${file.originalname}`, arrayBufferImage, {
            contentType: ["image/jpeg", "image/webp", "image/png"],
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
      section,
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

const excluirProduto = async(req, res)=> {
  const {id} = req.params
  try{
    const produto = await Produto.findOneAndDelete({_id: id})
    return res.status(200).json({message: "Produto excluído com sucesso"})
  }
  catch(err){
    console.log(err)
    return res.status(500).json({message: "Erro ao excluir produto"})
  }
}

// * controller de carregar um produto pelo ID
const carregaProdutoPeloIdeSlug = async (req, res) => {
  const { id } = req.params;
  const { slug } = req.params;

  const produto = await Produto.findOne({ _id: id, slug });
  if (!produto) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  return res.status(200).json(produto);
};

// * controller de atualizar o views do produto pelo ID
const aumentarViewsDoProduto = async (req, res) => {
  const { id } = req.params;
  const { slug } = req.params;
  try {
    const produto = await Produto.findOne({ _id: id, slug });
    if (produto) {
      const produtoAlterado = await Produto.findOneAndUpdate(
        { _id: id, slug },
        { views: produto.views ? produto.views + 1 : 1 }
      );
      res.json(produtoAlterado);
    }
  } catch (error) {
    res.status(404).json({ error: "Produto não encontrado" });
  }
};

// * controller para pesquisar produtos
const pesquisarProdutos = async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.status(400).json({ message: "Termo de pesquisa não fornecido" });
  }

  try {
    const produtosEncontrados = await Produto.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { section: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ],
    });

    if (produtosEncontrados.length === 0) {
      return res.status(404).json({ message: "Nenhum produto encontrado" });
    }

    res.status(200).json(produtosEncontrados);
  } catch (erro) {
    res
      .status(500)
      .json({ erro: "Erro ao pesquisar produtos", detalhes: erro.message });
  }
};

// * controller de adicionar comentario ao produto pelo ID e nome do produto
const adicionarComentario = async function (req, res) {
  const { id } = req.params;
  const { name, comment, title, rate, userId } = req.body;
  if (name && comment && title && rate) {
    try {
      const produto = await Produto.findById(id);
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      const comentario = {
        name,
        comment,
        title,
        userId,
        rate,
        createdAt: Date(),
      };
      produto.comments.push(comentario);
      await produto.save();
      res.json(produto.comments);
    } catch (error) {
      throw error;
    }
  } else {
    res.status(400).json({ error: "Campos obrigatórios não informados" });
  }
};

const enviarImagens = async (req, res) => {
  try {
    console.log('Recebendo imagens no backend');
    const files = req.files;
    let imageUrls = [];

    for (let file of files) {
      const arrayBufferImage = Uint8Array.from(file.buffer).buffer;
      const uniqueFileName = `${Date.now()}-${file.originalname}`;

      const { data: uploadedFile, error: uploadError } = await supabaseProducts.storage
        .from("products_images")
        .upload(uniqueFileName, arrayBufferImage, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Erro ao fazer upload da imagem:", uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: imageUrl, error: urlError } = supabaseProducts.storage
        .from("products_images")
        .getPublicUrl(uniqueFileName);

      if (urlError) {
        console.error("Erro ao obter a URL da imagem:", urlError);
        return res.status(500).json({ error: urlError.message });
      }
      imageUrls.push(imageUrl.publicUrl);
    }

    return res.status(200).json(imageUrls);
  } catch (err) {
    console.error('Erro no backend:', err);
    return res.status(500).json({ error: 'Erro ao processar as imagens.' });
  }
};

const getVendas = async(req, res)=> {
  try{
    const usuarios = await Usuario.find()
    const pedidosConcluidos = usuarios.flatMap((u) => u.orders.filter((o) => o.status === 'finished'));
    return res.status(200).json(pedidosConcluidos)
  }
  catch(err){
    console.log(err)
  }
}

const getUsers = async(req, res)=> {
  try{
    const usuariosLength = await Usuario.find()
    return res.status(200).json(usuariosLength.length)
  }
  catch(err){
    console.log(err)
  }
}

// * controller de editar um produto pelo ID
const editarProduto = async (req, res) => {
  const { id } = req.params;

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

  const {
    title,
    description,
    price,
    oldPrice,
    category,
    section,
    tags,
    images,
  } = req.body;

  try {
    const produtoAlterado = await Produto.findByIdAndUpdate(id, {
      title,
      description,
      price,
      oldPrice,
      slug: limpaSlug(title),
      category,
      section,
      tags,
      images,
    });
    return res.status(200).json({
      message: "Produto atualizado com sucesso",
      produto: produtoAlterado,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: "Autorização inválida" });
  }
};

// * objeto do controller de produtos
const ProdutosControllers = {
  carregarProdutos,
  criarProduto,
  excluirProduto,
  carregaProdutoPeloIdeSlug,
  aumentarViewsDoProduto,
  editarProduto,
  adicionarComentario,
  pesquisarProdutos,
  enviarImagens,
  getVendas,
  getUsers
};

export default ProdutosControllers;
