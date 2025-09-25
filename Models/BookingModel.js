const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // user_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   refPath: "user_type", 
    //   required: true,
    // },
    // user_type: {
    //   type: String,
    //   enum: ["NormalUser", "GoogleUser"],
    //   required: true,
    // },
    // user_email: {
    //   type: String,
    //   required: true,
    // },

    theater_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theater",
      required: true,
    },
    theater_name: {
      type: String,
      required: true,
    },

    audi_number: {
      type: String,
      required: true,
    },

    movie_title: {
      type: String,
      required: true,
    },
    movie_language: {
      type: String,
      required: true,
    },

    showtime: {
      type: String, // e.g. "18:30"
      required: true,
    },
    show_date: {
      type: Date,
      required: true,
    },

    seats: [
      {
        type: String, // seat numbers like "A1", "B5"
        required: true,
      },
    ],

    seat_price_total: {
      type: Number,
      required: true,
    },

    snacks: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],

    snacks_total: {
      type: Number,
      default: 0,
    },

    parking_slot: {
      type: String,
      default: null,
    },

    total_price: {
      type: Number,
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "paid",
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
