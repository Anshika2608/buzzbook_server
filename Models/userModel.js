const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email")
            }
        }
    },
    googleId: {
        type: String,
        default: null
    },
    image: String,
    mobile: { type: String, default: "" },
    birthday: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    profilePicture: { type: String, default: "" },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    cpassword: {
        type: String,
        required: true,
        minlength: 8
    },
    refreshToken: { type: String, default: null },
    verifytoken: {
        type: String,
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailOtp: {
        type: String,
        default: null
    },
    emailOtpExpiry: {
        type: Date,
        default: null
    }
});
userSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.cpassword = await bcrypt.hash(this.cpassword, 12);
    }
    next()
});



userSchema.methods.generateAccessToken = function () {
    return jwt.sign({ id: this._id }, ACCESS_SECRET, { expiresIn: "15m" });
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({ id: this._id }, REFRESH_SECRET, { expiresIn: "7d" });
};



module.exports = mongoose.model('users', userSchema)