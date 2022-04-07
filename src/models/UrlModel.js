const mongoose=require('mongoose')
const shortenSchema=new mongoose.Schema({
    urlCode:{
        type:String,
        trim:true,
        lowercase:true,
        unique:true
    },
    longUrl:{
        type:String,
        required:true,
        trim:true
    },
    shortUrl:{
        type:String,
        trim:true,
        unique:true
    }
},)

module.exports= mongoose.model("shortenUrl",shortenSchema)