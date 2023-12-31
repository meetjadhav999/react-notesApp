const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Note = require('./note.js')
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        unique:true,
        required: true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error(' email is invalid')
            }
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('password cannot be password')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
},{
    timestamps:true
})

userSchema.virtual('Notes',{
    ref:'Note',
    localField:'_id',
    foreignField:'owner'
})
userSchema.statics.findByCredentials = async(email,password) => {
    const user = await User.findOne({email})
    if(!user){
        throw new Error('unable to log in')
    }
    const ismatched = await bcrypt.compare(password,user.password)
    if(!ismatched){
        throw new Error('unable to log in')
    }
    return user
}
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id:user._id.toString()},'abcdefghijklmnopqrstuvwxyz')
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}
userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})
userSchema.pre('deleteOne',{ document: true }, async function(next){
    const user = this
    await Note.deleteMany({owner:user._id})

    next()
})

const User = mongoose.model('User',userSchema)

module.exports = User