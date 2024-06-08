import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config();
const jwtKey = process.env.JWT_KEY
const authMidleware = (req, res, next) => {
    const {authorization} = req.headers;

    if(!authorization){
        return res.status(401).json({error: 'Token não encontrado'})
    }
    const [, token] = authorization.split(' ')
    try {
        const decoded = jwt.verify(token, `${jwtKey}`)
        next()
    } catch (error) {
        return res.status(401).json({error: 'Token inválido'})
    }
}

export default authMidleware;