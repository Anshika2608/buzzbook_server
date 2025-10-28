const express = require("express");
const {
  getWishlist,
  addToWishlist,
} = require("../Controllers/wishlistController");
const authenticate = require("../Middleware/authenticate");
const router = express.Router();

router.get("/",authenticate, getWishlist);
router.post("/add",authenticate, addToWishlist);

module.exports = router;
