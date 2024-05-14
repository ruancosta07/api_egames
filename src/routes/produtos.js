const { supabaseProducts, supabaseBase } = require("../database/connect");
const produtos = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

produtos.get("/produtos", async (req, res) => {
  const { data, error } = await supabaseProducts
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error)
    return res.status(400).json({ message: "Erro ao carregar produtos" });
  return res.status(200).json(data);
});

produtos.post("/criar-produto", upload.array("image"), async (req, res) => {
  const { title, description, price, oldPrice, category } = req.body;
  const files = req.files;
  const dataAtual = Date.now();
  let imageUrls = [];

  function limpaSlug(str){
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

  const { data, error } = await supabaseProducts
    .from("products")
    .insert([
      { title, description, price, oldPrice, category, slug:limpaSlug(title), images: imageUrls },
    ]);

  if (error) {
    console.error("Erro ao inserir produto:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.json({ message: "Produto criado com sucesso", data });
});

produtos.get("/produto/:id/:produto", async (req, res) => {
  const productUrl = req.params.produto;
  const id = req.params.id;

  const { data, error } = await supabaseBase
    .from("products")
    .select("*")
    .match({ slug: productUrl, id });
    if(error) return res.json({error: 'produto não encontrado'})
      return res.json(data)
});

module.exports = produtos;
