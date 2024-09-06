import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Usuario from "../models/Usuario.js";
dotenv.config();
const jwtKey = process.env.JWT_KEY;
const adminMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;
  
  if (!authorization) {
    return res.status(401).json({ error: "Autorização não fornecida" });
  } 
  const [, token] = authorization.split(" ");
   if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  try {
    const decoded = jwt.verify(token, `${jwtKey}`);
    const foundUser = await Usuario.findOne({ email: decoded.email });
    if (foundUser && foundUser.role === "admin") {
      return next();
    }
    return res.status(401).json({ error: "Usuário não tem permissão para realizar essa ação" }); 
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

export default adminMiddleware;
