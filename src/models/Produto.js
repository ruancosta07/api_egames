import {Schema, model} from "mongoose";

const ProdutoSchema = new Schema({
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
  views:{
    type: Number,
    default: 0,
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
  section:{
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    default: Date.now(),
  },
});

const Produto = model("produtos", ProdutoSchema);
export default Produto;
