const users = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken")
const registerUser = async (req, res) => {
    const { name, email, password, cpassword } = req.body;
    if (!name || !email || !password || !cpassword) {
        return res.status(400).json({ message: "Fill all the fields!" });
    }
    try {
        const nameRegex = /^[a-zA-Z]{2,40}$/;
        const preuser = await users.findOne({ email: email });
        if (preuser) {
            return res.status(400).json({ message: "User already exists!" });
        }
        else if (password !== cpassword) {
            return res.status(400).json({ message: "password and confirmPassword does not matches!" })
        }
        else if(password.length<6){
            return res.status(400).json({message:"password must be at least 8 characters long!"})

        } else if (!nameRegex.test(name)) {
            return res.status(400).json({ message: "Name must contain only alphabets and be between 2 and 40 characters long!" });
        } else {
            const finalUser = new users({ name, email, password, cpassword });
            const storeUser = await finalUser.save();
            console.log(storeUser);
            res.status(201).json({ message: "User Successfully added" });

        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error while registering a user", error: error.message });
    }
}
const loginUser = async (req, res) => {
    console.log("Login request received");
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Fill all the required fields!" });
    }

    try {
        const preUser = await users.findOne({ email: email });
        if (!preUser) {
            return res.status(400).json({ message: "User does not exist!" });
        } else {
            const isMatch = await bcrypt.compare(password, preUser.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid details!" });
            } else {
                const token = await preUser.generateAuthToken();
                res.cookie("usercookie", token, {
                    expires: new Date(Date.now() + 9000000),
                    httpOnly: true
                });

                const result = {
                    preUser,
                    token
                };
                return res.status(201).json({ message: "User logged in successfully", result });
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Error while logging in a user", error: error.message });
    }
};

module.exports={registerUser,loginUser}
