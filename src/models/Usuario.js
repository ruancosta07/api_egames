// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
import {Schema, model} from "mongoose";
import bcrypt from "bcrypt";

const UsuarioSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    required: true,
    default: "client",
  },
  adress: {
    cep: { type: String },
    logradouro: { type: String },
    complemento: { type: String },
    bairro: { type: String },
    cidade: { type: String },
    estado: { type: String },
    numero: { type: String },
  },
  preferences: {
    twoStepsAuth: {
      type: Boolean,
      default: false
    }
  },
  cart: [],
  favorites: [],
  orders: [],
  loginToken: {
    type: String
  },
  loginTokenExpiresAt: {
    type: String
  }
});

UsuarioSchema.pre("save", async function (next) {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
  next();
});

const Usuario = model("usuarios", UsuarioSchema);

export default Usuario;
