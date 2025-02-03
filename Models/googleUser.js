const mongoose = require("mongoose");
const googleSchema=new mongoose.Schema({
    googleId:String,
    displayName:String,
    email:String,
    image:String
},{timestamps:true})
module.exports=mongoose.model("googleUsers",googleSchema);