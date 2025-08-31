const mongoose = require("mongoose");

const castSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  photo: { type: String, required: true } 
});

const trailerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
});

const reviewSchema = new mongoose.Schema({
  critic_name: { type: String, required: true },
  rating: { type: Number, required: true }, 
  review: { type: String, required: true }
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  language: { type: [String], required: true },
  release_date: { type: Date, required: true },
  genre: { type: [String], required: true },
  adult: { type: Boolean, required: true },
  duration: { type: Number, required: true }, 
  rating: { type: Number, required: true },
  Type: { type: String, required: true },
  industry: { type: String, enum: ["Bollywood", "Hollywood","Tollywood", "Other"], default: "Other" },
  production_house: { type: String, required: true },
  director: { type: String, required: true },
  cast: { type: [castSchema], required: true },
  description: { type: String, required: true },
  poster_img: { type: [String], required: true }, 
  trailer: { type: [trailerSchema], required: false },
  certification: { type: String, default: "" },
  status: { type: String, default: "upcoming" }, 
  reviews: { type: [reviewSchema], default: [] } 
});

module.exports = mongoose.model("movie", movieSchema);
