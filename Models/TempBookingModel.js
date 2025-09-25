const mongoose = require("mongoose");

const tempBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // logged in user
    userEmail: { type: String, required: true },
       theater_id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Theater",
         required: true,
       },
    audi_number: { type: String, required: true },
    movie_title: { type: String, required: true },
    movie_language: { type: String, required: true },
    showtime: { type: String, required: true },
    show_date: { type: Date, required: true },
    seats: { type: [String], required: true },
    snacks: { type: [{ name: String, price: Number, qty: Number }], default: [] },
    parking_slot: { type: String, default: null },
    seat_price_total: { type: Number, required: true },
    snacks_total: { type: Number, default: 0 },
    total_price: { type: Number, required: true },
    hold_expires_at: { type: Date, required: true },
    paymentId: { type: String, default: null },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
}, { timestamps: true });

// TTL index: auto-delete expired holds
tempBookingSchema.index({ hold_expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TempBooking", tempBookingSchema);
