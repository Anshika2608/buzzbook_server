// models/bookingModel.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  theater_id: { type: mongoose.Schema.Types.ObjectId, ref: "Theater", required: true },
  audi_number: { type: Number, required: true },
  movie_title: { type: String, required: true },
  showtime: { type: String, required: true },

  seats: [String],
  seat_price_total: { type: Number, required: true },

  snacks: [
    {
      snack_id: { type: mongoose.Schema.Types.ObjectId, ref: "Snack" },
      name: String,
      quantity: Number,
      unit: String,
      price: Number
    }
  ],
  snacks_total: { type: Number, default: 0 },

  parking_slot: {
    slot_number: { type: String },
    price: { type: Number, default: 0 }
  },

  total_price: { type: Number, required: true },

  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  payment_status: { type: String, enum: ["unpaid", "paid", "failed"], default: "unpaid" },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
