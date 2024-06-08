// compressImages.js

import sharp from 'sharp';

const compressImages = async (req, res, next) => {
    const promises = req.files.map(async (file, index) => {
        const compressedImage = await sharp(file.buffer).resize().webp({ quality: 60 }).toBuffer();
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

export default compressImages;
