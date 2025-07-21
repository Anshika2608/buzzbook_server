const users = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const passport = require("passport");
const nodemailer = require("nodemailer");
const keysecret = process.env.SECRET_KEY
//emailconfig
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})
const registerUser = async (req, res) => {
    const { name, email, password, cpassword, recaptchaToken } = req.body;

    if (!name || !email || !password || !cpassword || !recaptchaToken) {
        return res.status(400).json({ message: "Fill all the fields!" });
    }

    // ✅ Allow test bypass
    if (recaptchaToken !== "test-token") {
        try {
            const response = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`,
                null,
                {
                    params: {
                        secret: process.env.RECAPTCHA_SECRET,
                        response: recaptchaToken,
                    },
                }
            );

            if (!response.data.success || response.data.score < 0.5) {
                return res.status(400).json({
                    message: "reCAPTCHA validation failed or suspicious activity detected!",
                    score: response.data.score,
                });
            }
        } catch (error) {
            return res.status(500).json({ message: "reCAPTCHA error", error: error.message });
        }
    }

    // ✅ Continue with your existing validations and save
    try {
        const nameRegex = /^[a-zA-Z ]{2,40}$/;
        const preuser = await users.findOne({ email: email });
        if (preuser) {
            return res.status(400).json({ message: "User already exists!" });
        } else if (password !== cpassword) {
            return res.status(400).json({ message: "Password and confirmPassword do not match!" });
        } else if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters!" });
        } else if (!nameRegex.test(name)) {
            return res.status(400).json({ message: "Name must contain only alphabets (2-40 characters)!" });
        }

        const finalUser = new users({ name, email, password, cpassword });
        const storeUser = await finalUser.save();
        console.log(storeUser);
        res.status(201).json({ message: "User Successfully added" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error while registering a user", error: error.message });
    }
};

const loginUser = async (req, res) => {

    const { email, password, recaptchaToken } = req.body;
    if (!email || !password || !recaptchaToken) {
        return res.status(400).json({ message: "Fill all the required fields!" });
    }
    try {
        console.log("Received reCAPTCHA Token:", recaptchaToken);
        if (recaptchaToken !== "test-token") {
            const response = await axios.post(
                `https://www.google.com/recaptcha/api/siteverify`,
                null,
                {
                    params: {
                        secret: process.env.RECAPTCHA_SECRET,
                        response: recaptchaToken,
                    },
                }
            );

            if (!response.data.success || response.data.score < 0.5) {
                return res.status(400).json({
                    message: "reCAPTCHA validation failed or suspicious activity detected!",
                    score: response.data.score,
                });
            }
        }


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
const validUser = async (req, res) => {
    try {
        const preUserOne = await users.findOne({ _id: req.userId });
        res.status(201).json({ status: 201, preUserOne });
    } catch (error) {
        res.status(401).json({ status: 401, error });
    }
};
googleLogin = passport.authenticate("google", {
    scope: ["profile", "email"]
});
const sendemaillink = async (req, res) => {

    const { emailaddress } = req.body;
    if (!emailaddress) {
        res.status(401).json({ status: 401, message: "Enter your email" })
    }

    try {
        const userfind = await users.findOne({ email: emailaddress })
        if (!userfind) {
            return res.status(401).json({ status: 401, message: "User not found" });
        }
        const token = jwt.sign({ _id: userfind._id }, keysecret, {
            expiresIn: "20m"
        });
        const setusertoken = await users.findByIdAndUpdate({ _id: userfind._id }, { verifytoken: token }, { new: true });
        if (setusertoken) {
            const mailOptions = {
                from: process.env.EMAIL,
                to: emailaddress,
                subject: "Sending Email For password Reset",
                text: `This Link Valid For 20 MINUTES http://localhost:5173/NewPassword/${userfind.id}/${setusertoken.verifytoken}`
            }

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("error", error);
                    res.status(401).json({ status: 401, message: "email not send" })
                } else {
                    console.log("Email sent", info.response);
                    res.status(201).json({ status: 201, message: "Email sent Successfully" })
                }
            })

        }

    }

    catch (err) {
        console.error("Catch block error:", err);
        res.status(401).json({ status: 401, message: "invalid user" })
    }
}
// verify user for forgot password time

const verifyForgot = async (req, res) => {
    const { id, token } = req.params;
    try {
        const validuser = await users.findOne({ _id: id, verifytoken: token })
        const verifyToken = jwt.verify(token, keysecret)
        if (validuser && verifyToken._id) {
            res.status(201).json({ status: 201, validuser })
        } else {
            res.status(401).json({ status: 401, message: "user not exist" })
        }
    } catch (err) {
        res.status(401).json({ status: 401, message: err })
    }
}
const changePassword = async (req, res) => {
    const { id, token } = req.params;

    const { passwords } = req.body;

    try {
        const validuser = await users.findOne({ _id: id, verifytoken: token });
        if (!validUser) {
            return res.status(401).json({ status: 401, message: "User does not exist" });
        }
        const verifyToken = jwt.verify(token, keysecret);

        if (validuser && verifyToken._id) {
            const newpassword = await bcrypt.hash(passwords, 12);

            const setnewuserpass = await users.findByIdAndUpdate({ _id: id }, { password: newpassword });

            setnewuserpass.save();
            res.status(201).json({ status: 201, setnewuserpass })

        } else {
            res.status(401).json({ status: 401, message: "user not exist" })
        }
    } catch (error) {
        res.status(401).json({ status: 401, error })
    }
}

module.exports = { registerUser, loginUser, validUser, googleLogin, sendemaillink, verifyForgot, changePassword }
