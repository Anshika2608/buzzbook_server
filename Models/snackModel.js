const mongoose = require("mongoose");

const snackSchema = new mongoose.Schema({
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theater", 
    required: true,
  },
    name: { type: String, required: true },
    snack_img: {
        type: Array,
        required: false
    },
  description: { type: String },
    available: { type: Boolean, default: true },
    category: {
        type: String,
        enum: ["Veg", "Non-Veg"],
        required: true
    },
    ingredients: { type: [String], default: [] },
      quantity_options: [
    {
      unit: { type: String, required: true }, 
      price: { type: Number, required: true } 
    }
  ],
    rating: { type: Number, min: 0, max: 5 }
});

module.exports = mongoose.model("Snack", snackSchema);
