const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  movies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movie",
    },
  ],
  theaters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
