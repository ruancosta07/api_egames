const  supabaseProducts  = require("../database/connect");
const produtos = require("express").Router();
const multer = require("multer");
const authMidleware = require("../middlewares/authMiddleware");
const Produto = require("../models/Produto");
const compressImages = require("../middlewares/compressImages");
produtos.get("/produtos", async (req, res) => {
  try {
    const produtosCarregados = await Produto.find().sort({
      createdAt: "descending",
    });
    res.json(produtosCarregados);
  } catch (error) {
    throw error;
  }
});

const upload = multer({ storage: multer.memoryStorage() });
produtos.post("/criar-produto", upload.array("image"), compressImages, authMidleware, async (req, res) => {
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
});

produtos.get("/produto/:id/:produto", async (req, res) => {
  const productUrl = req.params.produto;
  const id = req.params.id;

  const produto = await Produto.findOne({ slug: productUrl, _id: id });
  if (!produto) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  return res.status(200).json(produto);
});


module.exports = produtos;
