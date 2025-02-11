const express = require("express");
const router = express.Router();

const {uploadMultiple} = require("../Middleware/Multer"); 
const { getMovie, addMovie,getMovieFromLocation } = require("../Controllers/movieController");


router.get("/movie_list", getMovie);
router.post("/add_movie", uploadMultiple, addMovie);
router.get("/getMovie",getMovieFromLocation)
module.exports = router;
