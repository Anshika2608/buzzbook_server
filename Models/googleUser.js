const mongoose = require("mongoose");
const googleSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    image: String,
    mobile: { type: String, default: "" },
    birthday: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    profilePicture: { type: String, default: "" }
}, { timestamps: true })
module.exports = mongoose.model("googleUsers", googleSchema);