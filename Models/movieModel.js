const mongoose = require("mongoose");
const movieSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    language: {
        type:String,
        required:true
    },
    release_date:{
        type:Date,
        required:true
    },
    genre: {
        type:Array,
        required:true
    },
    adult:{
        type:Boolean,
        required:true
    } ,
    duration:{
        type:Number,
        required:true
    } ,
    rating:{
       type:Number,
       required:true
    } ,
    Type:{
       type:String,
       required:true
    },
    production_house:{
        type:String,
        required:true
    },
    director:{
        type:String,
        required:true
    },
    cast:{
        type:Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    poster:{
        type:Array,
        required:true
    },
    trailer:{
        type:Array,
        required:true
    }
    
})
module.exports=mongoose.Schema("movie",movieSchema)