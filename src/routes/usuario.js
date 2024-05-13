const usuario = require("express").Router();
const {supabaseProducts} = require("../database/connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()
const jwtKey = process.env.JWT_KEY
usuario.post("/criar-conta", async (req, res) => {
  const { name, email, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabaseProducts
    .from("usuarios")
    .insert([{ name, email, password: hashPassword }]);
    console.log(error)
  if (error.code == "23505") return res.status(400).json({message:"Esse email já está cadastrado."});
  return res.status(200).json({message:"Usuário criado com sucesso!"});
});

usuario.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabaseProducts
    .from("usuarios")
    .select()
    .match({ email });
  const hashPassword = data[0].password;
  const result = await bcrypt.compare(password, hashPassword);
  if (!result) return res.send("Senha incorreta");
  else{
    const userToken = jwt.sign({ email, role: "client" }, `${jwtKey}`, {
        expiresIn: "20m",
      });
      req.session.userToken = userToken;
      res.cookie('userToken', userToken, {
        secure:false,
        maxAge: 20 * 60 * 1000,
        httpOnly: false,
        // sameSite: 'none',
        path: '/'
      })
      res.json({message: 'Usuário logado!'})
  }
});

usuario.post('/sla', (req, res)=>{
    const {userToken} = req.body
    console.log(userToken);
    if(userToken){
        res.json({message: 'usuário autenticado.'})
    }
    else{
        res.json({message: 'usuário não autenticado.'})
    }
})

// usuario.get('/sla', (req, res)=>{
//     const {userToken} = req.body
//     //console.log(userToken);
//     if(userToken){
//         res.json({message: 'usuário autenticado.'})
//     }
//     else{
//         res.json({message: 'usuário não autenticado.'})
//     }
// })

module.exports = usuario;
