const express=require("express")
const router=express.Router()
const{getMovie,addMovie}=require("../Controllers/movieController")
router.get("/movie_list",getMovie);
 router.post("/add_movie",addMovie);
 
module.exports=router;