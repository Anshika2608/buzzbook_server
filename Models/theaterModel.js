const mongoose = require("mongoose")
const seatLayout=new mongoose.Schema({
    seat_number: {type:String},
    type: { type: String, required:true },
    is_booked: { type: Boolean, default: false }
})
const theaterSchema = new mongoose.Schema({
    theater_id: {
        type: String,
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
        type: String,
        required: true
    },
    layout_type:{
        type:String,
        required:true
    },
    seating_capacity: {
        type: Number,
        required: true
    },
    vipRows: {
        type: Number,
        default: 0
    },
    premiumRows: {
        type: Number,
        default: 0
    },
    sofaRows: {
        type: Number,
        default: 0
    },
    regularRows: {
        type: Number,
        default: 0
    },
    reclinerRows: {
        type: Number,
        default: 0
    },
    emptySpaces: {
        type: [String],
        default: []
    },
    seating_layout:[[seatLayout]]
})
module.exports=mongoose.model("Theaters",theaterSchema)