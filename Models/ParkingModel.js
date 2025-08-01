const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  slot_id: { type: String, required: true },
  is_held: { type: Boolean, default: false },
  is_booked: { type: Boolean, default: false },
  hold_expires_at: { type: Date, default: null }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  slot_id: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  time: { type: Date, required: true },
  is_paid: { type: Boolean, default: false }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  block_id: { type: String, required: true },
  type: { type: String, enum: ["2-wheeler", "4-wheeler"], required: true },
  price: { type: Number, required: true },
  slots: [slotSchema],
  bookings: [bookingSchema],
  is_full: { type: Boolean, default: false }
}, { _id: false });

const floorSchema = new mongoose.Schema({
  floor: { type: Number, required: true },
  blocks: [blockSchema]
}, { _id: false });

const parkingLayoutSchema = new mongoose.Schema({
  theater_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theater",
    required: true,
    unique: true
  },
  floors: [floorSchema]
});

module.exports = mongoose.model("TheaterParkingLayout", parkingLayoutSchema);
