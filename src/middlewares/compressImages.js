// compressImages.js

const sharp = require('sharp');

const compressImages = async function(req, res, next) {
    const promises = req.files.map(async (file, index) => {
        // Comprime a imagem e converte para webp
        const compressedImage = await sharp(file.buffer).resize().webp({ quality: 60 }).toBuffer();

        // Cria um novo objeto de arquivo com o buffer da imagem comprimida
        const newFile = {
            ...file,
            buffer: compressedImage,
            size: compressedImage.byteLength,
            originalname: file.originalname.replace(/\.[^/.]+$/, ".webp"),
        };

        // Substitui o arquivo original pelo novo arquivo no array req.files
        req.files[index] = newFile;
    });

    // Aguarda todas as promessas serem resolvidas
    await Promise.all(promises);

    next();
}

module.exports = compressImages
