// compressImages.js

import sharp from "sharp";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
const jwtKey = process.env.JWT_KEY;
const compressImages = async (req, res, next) => {
  const [, token] = req.headers.authorization.split(" ");
  const decoded = jwt.decode(token, `${jwtKey}`);
  const usuario = await Usuario.findOne({ email: decoded.email });
  if (usuario) {
    if (req.files) {
      const promises = req.files.map(async (file, index) => {
        const compressedImage = await sharp(file.buffer)
          .resize()
          .webp({ quality: 60 })
          .toBuffer();
        const newFile = {
          ...file,
          buffer: compressedImage,
          size: compressedImage.byteLength,
          originalname: file.originalname.replace(/\.[^/.]+$/, ".webp"),
        };
        req.files[index] = newFile;
      });
      await Promise.all(promises);
      next();
    } 
  }
  else {
    res.status(401).json({ error: "Apenas administradores podem postar produtos" });
    next();
  }
};

export default compressImages;
