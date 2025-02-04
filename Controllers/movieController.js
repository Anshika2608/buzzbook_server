const movie=require("../Models/movieModel")
const getMovie=async(req,res)=>{
    try{
       const listOfMovies=await movie.find({});
       return res.status(201).json({message:"list of movies recieved successfully",listOfMovies})
}catch(error){
   return res.status(500).json({message:"error while getting list of movies",error:error.message})
}
   
}
const addMovie=async(req,res)=>{

}
module.exports={getMovie,addMovie}