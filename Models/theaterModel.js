const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    seat_number: { type: String },
    type: { type: String, required: true },
    is_booked: { type: Boolean, default: false }
});

const showtimeSchema = new mongoose.Schema({
    showtime_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    time: { type: String, required: true },
    seating_layout: [[seatSchema]]  
});

const filmSchema = new mongoose.Schema({
    film_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    language: { type: String, required: true },
    showtimes: [showtimeSchema] 
});

const theaterSchema = new mongoose.Schema({
    theater_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    popular: { type: Boolean, required: true },
    films_showing: [filmSchema], 
    contact: { type: String, required: true },
    layout_type: { type: String, required: true },
    seating_capacity: { type: Number, required: true },
    vipRows: { type: Number, default: 0 },
    premiumRows: { type: Number, default: 0 },
    sofaRows: { type: Number, default: 0 },
    regularRows: { type: Number, default: 0 },
    reclinerRows: { type: Number, default: 0 },
    emptySpaces: { type: [String], default: [] },
    rows: { type: Number, required: true },
    seatsPerRow: { type: Number, required: true }
});

const Theater = mongoose.model("Theater", theaterSchema);
module.exports = Theater;
