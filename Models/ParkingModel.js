// models/parkingBlockModel.js
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  slot_id: { type: String, required: true },
  is_held: { type: Boolean, default: false },
  is_booked: { type: Boolean, default: false },
  hold_expires_at: { type: Date, default: null }
}, { _id: false });

const parkingBlockSchema = new mongoose.Schema({
  theater_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theater",
    required: true
  },
  block_id: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ["2-wheeler", "4-wheeler"],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  slots: [slotSchema],
  is_full: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("ParkingBlock", parkingBlockSchema);
