const express = require("express");
const router = express.Router();

const {uploadMultiple} = require("../Middleware/Multer"); 
const { getMovie, addMovie } = require("../Controllers/movieController");


router.get("/movie_list", getMovie);
router.post("/add_movie", uploadMultiple, addMovie);

module.exports = router;
