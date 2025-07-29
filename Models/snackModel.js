const mongoose = require("mongoose");

const snackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
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
      unit: { type: String, required: true }, // e.g. Small, Medium, Large
      price: { type: Number, required: true } // price for that unit
    }
  ],
    rating: { type: Number, min: 0, max: 5 }
});

module.exports = mongoose.model("Snack", snackSchema);
