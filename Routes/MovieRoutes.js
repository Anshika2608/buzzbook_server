const express = require("express");
const router = express.Router();

const {uploadMultiple} = require("../Middleware/Multer"); 
const { getMovie, addMovie,getMovieFromLocation, getMovieDetails,deleteMovie,comingSoon,getUniqueGenres ,getMoviesByGenre,getMovieByLanguage,
    addReplyToReview,toggleHelpfulReview,getRepliesForReview,addReview
} = require("../Controllers/movieController");

const authenticate = require("../Middleware/Authenticate")
router.get("/movie_list", getMovie);
router.post("/add_movie", uploadMultiple, addMovie);
router.get("/getMovie",getMovieFromLocation)
router.get("/movieDetails/:id",getMovieDetails)
router.delete("/deleteMovie/:movieId",deleteMovie)
router.get("/comingSoon",comingSoon)
router.get("/uniqueGenres",getUniqueGenres)
router.get("/getMoviesByGenre",getMoviesByGenre)
router.get("/getMovieByLanguage",getMovieByLanguage)
// Add reply to review
router.post(
  "/:movieId/reviews/:reviewId/replies",
  authenticate,
  addReplyToReview
);

// Like / Unlike review 
router.post(
  "/:movieId/reviews/:reviewId/helpful",
  authenticate,
  toggleHelpfulReview
);

// Get all replies for a review 
router.get(
  "/:movieId/reviews/:reviewId/replies",
  getRepliesForReview
);
router.post("/:movieId/reviews",authenticate,addReview)
module.exports = router;
