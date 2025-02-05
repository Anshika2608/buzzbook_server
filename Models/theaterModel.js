const mongoose = require("mongoose")
const theaterSchema = new mongoose.Schema({
    theater_id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    popular:{
        required:true,
        type:Boolean
    },
    films_showing: {
        type: [
            {
                title: { type: String, required: true },
                language: { type: String, required: true },
                showtimes: { type: [String], required: true }
            }
        ],
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    seating_capacity: {
        type: Number,
        required: true
    },
    seating_layout: {
        type: [
            {
                row: { type: String, required: true }, 
                seats: [
                    {
                        seat_number: { type: String, required: true }, 
                        type: { type: String, enum: ["Regular", "Premium", "VIP"], required: true },
                        price: { type: Number, required: true },
                        is_booked: { type: Boolean, default: false } 
                    }
                ]
            }
        ],
        required: true
    }
})
module.exports=mongoose.model("Theaters",theaterSchema)