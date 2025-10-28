const Wishlist = require("../Models/WishlistModel");
const users = require("../Models/userModel");
const googleUsers = require("../Models/googleUser");

const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "movies",
        select: "title poster_img rating genre release_date", 
      })
      .populate({
        path: "theaters",
        select: "name location address facilities",
      });

    if (!wishlist) {
      return res.status(200).json({ wishlist: { movies: [], theaters: [] } });
    }

    res.status(200).json({ wishlist, userType: req.userType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { movieId, theaterId } = req.body;

    let user =
      req.userType === "normal"
        ? await users.findById(userId)
        : await googleUsers.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) wishlist = new Wishlist({ userId });

    let message = "";

    if (movieId) {
      const exists = wishlist.movies.includes(movieId);
      if (exists) {
        wishlist.movies = wishlist.movies.filter(
          (id) => id.toString() !== movieId.toString()
        );
        message = "Movie removed from wishlist";
      } else {
        wishlist.movies.push(movieId);
        message = "Movie added to wishlist";
      }
    }

    if (theaterId) {
      const exists = wishlist.theaters.includes(theaterId);
      if (exists) {
        wishlist.theaters = wishlist.theaters.filter(
          (id) => id.toString() !== theaterId.toString()
        );
        message = "Theater removed from wishlist";
      } else {
        wishlist.theaters.push(theaterId);
        message = "Theater added to wishlist";
      }
    }

    await wishlist.save();
    res.status(200).json({ message, wishlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist };
