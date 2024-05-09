const {supabaseProducts} = require('../database/connect')
const produtos = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

produtos.get("/produtos", async (req, res) => {
  const { data, error } = await supabaseProducts.from("products").select("*").order('created_at', {ascending:false});
  if (error) return res.json({ message: "Erro ao carregar produtos" });
  return res.json(data);
});

produtos.post("/criar-produto", upload.array("image"), async (req, res) => {
  const { title, description, price, oldPrice } = req.body;
  const files = req.files;
    const dataAtual = Date.now()
  let imageUrls = [];

  for (let file of files) {
    
    const arrayBufferImage = Uint8Array.from(file.buffer).buffer;

    
    const { data: uploadedFile, error: uploadError } =
      await supabaseProducts.storage
        .from("products_images")
        .upload(`${dataAtual}-${file.originalname}`, arrayBufferImage, {
          contentType: ["image/jpeg", 'image/webp'],
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

  // console.log(imageUrls);

  const { data, error } = await supabaseProducts
    .from("products")
    .insert([{ title, description, price, oldPrice, images: imageUrls }]);

  if (error) {
    console.error("Erro ao inserir produto:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.json({ message: "Produto criado com sucesso", data });
});

module.exports = produtos;
