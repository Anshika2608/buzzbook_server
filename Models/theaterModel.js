const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seat_number: { type: String },
  type: { type: String, required: true },
  is_booked: { type: Boolean, default: false },
  is_held: { type: Boolean, default: false },
  hold_expires_at: { type: Date },
});

const showtimeSchema = new mongoose.Schema({
  time: { type: String, required: true },
  audi_number: { type: String, required: true },
  prices: {
    VIP: { type: Number },
    Premium: { type: Number },
    Regular: { type: Number },
    Sofa: { type: Number },
    Recliner: { type: Number }
  }
});


const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  language: { type: String, required: true },
  showtimes: [showtimeSchema],

});


const audiSchema = new mongoose.Schema({
  audi_number: { type: String, required: true },
  layout_type: { type: String, required: true },
  rows: { type: Number, required: true },
  seatsPerRow: { type: Number, required: true },
  seating_capacity: { type: Number, required: true },
  seating_layout: [[seatSchema]],
  vipRows: { type: Number, default: 0 },
  premiumRows: { type: Number, default: 0 },
  sofaRows: { type: Number, default: 0 },
  regularRows: { type: Number, default: 0 },
  reclinerRows: { type: Number, default: 0 },
  emptySpaces: { type: [String], default: [] },
  films_showing: [filmSchema]
});

const theaterSchema = new mongoose.Schema({
  theater_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" }
  },
  address: { type: String, required: true },
  popular: { type: Boolean, required: true },
  contact: { type: String, required: true },
  audis: [audiSchema]
});


const Theater = mongoose.model("Theater", theaterSchema);
module.exports = Theater;
