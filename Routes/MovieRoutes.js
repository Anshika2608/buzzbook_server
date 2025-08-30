const express = require("express");
const router = express.Router();

const {uploadMultiple} = require("../Middleware/Multer"); 
const { getMovie, addMovie,getMovieFromLocation, getMovieDetails,deleteMovie,comingSoon,getUniqueGenres ,getMoviesByGenre, getUniqueLanguages,getMovieByLanguage} = require("../Controllers/movieController");

const authenticate = require("../Middleware/Authenticate")
router.get("/movie_list", getMovie);
router.post("/add_movie", uploadMultiple, addMovie);
router.get("/getMovie",getMovieFromLocation)
router.get("/movieDetails/:id",getMovieDetails)
router.delete("/deleteMovie/:movieId",deleteMovie)
router.get("/comingSoon",comingSoon)
router.get("/uniqueGenres",getUniqueGenres)
router.get("/getMoviesByGenre",getMoviesByGenre)
router.get("/getUniqueLanguages",getUniqueLanguages)
router.get("/getMovieByLanguage",getMovieByLanguage)
module.exports = router;
