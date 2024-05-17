const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Produto = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [],
  oldPrice: {
    type: String,
  },
  stock: {
    type: String,
  },
  comments: [],
  slug: {
    type: String,
    required: true
  },
  category:{
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    default: Date.now(),
  },
});

module.exports = mongoose.model("produtos", Produto);
