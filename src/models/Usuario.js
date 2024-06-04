const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const Usuario = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select:false
    },
    role:{
        type: String,
        required: true,
        default: 'client'
    },
    adress:[],
    cart: [],
    favorites:[]
})

Usuario.pre('save', async function(next){
    if(this.isModified('password')) this.password = await bcrypt.hash(this.password, 12)
        next()
})

module.exports = mongoose.model('usuarios', Usuario)