const jwt = require('jsonwebtoken')
const jwtKey = process.env.JWT_KEY
function authMidleware(req, res, next) {
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

module.exports = authMidleware;