const supabaseProducts = require("../database/connect");
const produtos = require("express").Router();
const multer = require("multer");
const authMidleware = require("../middlewares/authMiddleware");
const Produto = require("../models/Produto");
const compressImages = require("../middlewares/compressImages");
const nodeCache = require("node-cache");
const myCache = new nodeCache({ stdTTL: 3600, checkperiod: 120 });
const axios = require("axios").default;

produtos.get("/produtos", async (req, res) => {
  try {
    let produtosCarregados = myCache.get("produtos");

    if (!produtosCarregados) {
      produtosCarregados = await Produto.find().sort({
        createdAt: "descending",
      });
      myCache.set("produtos", produtosCarregados);
    }

    res.json(produtosCarregados);
  } catch (error) {
    throw error;
  }
});

const upload = multer({ storage: multer.memoryStorage() });
produtos.post(
  "/criar-produto",
  upload.array("image"),
  compressImages,
  authMidleware,
  async (req, res) => {
    const { title, description, price, oldPrice, category } = req.body;
    const files = req.files;
    const dataAtual = Date.now();
    let imageUrls = [];

    let comentarios = [
      {
        usuario: "Ruan Costa",
        comentario:
          "Eu amei esse produto, chegou muito rápido e funcionou muito bem.",
      },
    ];

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
      comments: comentarios,
    };
    try {
      const produtoSalvo = await new Produto(novoProduto).save();
      return res.json({ message: "Produto criado com sucesso", produtoSalvo });
    } catch (error) {
      throw error;
    }
  }
);

produtos.get("/produto/:id/:nome", async (req, res) => {
  const productUrl = req.params.nome;
  const id = req.params.id;

  const produto = await Produto.findOne({ _id: id, slug: productUrl });
  if (!produto) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  return res.status(200).json(produto);
});

produtos.patch("/produto/:id/:nome", authMidleware, async function (req, res) {
  const { id } = req.params;
  const { nome } = req.params;
  const { user, comment, title, rate } = req.body;
  const dataAtual = new Date();
  try {
    const comentariosAnteriores = await (
      await axios.get(`http://localhost:3000/produto/${id}/${nome}`)
    ).data.comments;
    const comentario = {
      user,
      comment,
      title,
      rate,
      createdAt: `${dataAtual.getDate()}/${
        dataAtual.getMonth() < 10 && "0" + (dataAtual.getMonth() + 1)
      }/${dataAtual.getFullYear()}`,
    };
    const novosComentarios = [...comentariosAnteriores, comentario];
    const produto = await Produto.findOne({ _id: id, slug: nome });
    if (!produto) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    if (produto) {
      const produtoAlterado = await Produto.findOneAndUpdate(
        { _id: id, slug: nome },
        { comments: novosComentarios }
      );
      res.json(produtoAlterado);
    }
  } catch (error) {
    throw error;
  }
});

module.exports = produtos;
