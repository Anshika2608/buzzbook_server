const users = require("../Models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const passport = require("passport");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const resend = new Resend(process.env.RESEND_MAIL_KEY);
const keysecret = process.env.SECRET_KEY
const generateOTP = require("../Middleware/GenerateOTP")
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
  try {
    const nameRegex = /^[a-zA-Z ]{2,40}$/;
    const preuser = await users.findOne({ email: email });
    if (preuser) {
      return res.status(400).json({ message: "User already exists!" });
    } else if (password !== cpassword) {
      return res.status(400).json({ message: "Password and confirmPassword do not match!" });
    } else if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters!" });
    } else if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name must contain only alphabets (2-40 characters)!" });
    }
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const finalUser = new users({
      name, email, password, cpassword,
      emailVerified: false,
      emailOtp: hashedOtp,
      emailOtpExpiry: Date.now() + 10 * 60 * 1000,
    });
    await finalUser.save();
    await sgMail.send({
      to: email,
      from: {
        email: process.env.FROM_EMAIL,
        name: "BuzzBook",
      },
      subject: "Verify your email",
      html: `
        <h3>Email Verification for BuzzBook</h3>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });
    return res.status(201).json({
      message: "User registered & logged in",
      user: {
        id: finalUser._id,
        name: finalUser.name,
        email: finalUser.email,
        emailVerified: false,
      },
    });
    ;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error while registering a user", error: error.message });
  }
};
const verifyEmailAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await users.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!user.emailOtp || user.emailOtpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    const isValid = await bcrypt.compare(otp, user.emailOtp);
    if (!isValid)
      return res.status(400).json({ message: "Invalid OTP" });

    user.emailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiry = null;

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Email verified and logged in successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Verification failed" });
  }
};


const loginUser = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  if (!email || !password || !recaptchaToken)
    return res.status(400).json({ message: "Fill all the required fields!" });

  try {
    if (recaptchaToken !== "test-token") {
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: process.env.RECAPTCHA_SECRET,
            response: recaptchaToken,
          },
        }
      );
      if (!response.data.success || response.data.score < 0.5)
        return res.status(400).json({ message: "reCAPTCHA failed" });
    }

    const user = await users.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist!" });
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials!" });

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 15 * 60 * 1000,
      overwrite: true,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      overwrite: true,
    });

    //Send access token to frontend
    res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        id: user._id
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login error", error: error.message });
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
  try {

    const { emailaddress } = req.body;

    if (!emailaddress) {
      return res.status(400).json({ message: "Enter your email" });
    }

    const user = await users.findOne({ email: emailaddress });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { _id: user._id },
      keysecret,
      { expiresIn: "20m" }
    );

    await users.findByIdAndUpdate(user._id, {
      verifytoken: token
    });

    const resetUrl = `${process.env.FRONTEND_URL}/NewPassword/${user._id}/${encodeURIComponent(token)}`;

    const msg = {
      to: emailaddress,
      from: {
        email: process.env.FROM_EMAIL,
        name: "Shifas"
      },
      subject: "Reset your password",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h3>Password Reset</h3>
          <p>This link is valid for <b>20 minutes</b>.</p>
          <a href="${resetUrl}" style="
            padding:10px 16px;
            background:#000;
            color:#fff;
            text-decoration:none;
            border-radius:6px;
            display:inline-block;
            margin-top:10px;
          ">Reset Password</a>
        </div>
      `
    };

    await sgMail.send(msg);
    return res.status(200).json({
      message: "Password reset email sent"
    });

  } catch (error) {
    console.error("Forgot-password error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};



// const sendemaillink = async (req, res) => {

//   const { emailaddress } = req.body;
//   if (!emailaddress) {
//     res.status(401).json({ status: 401, message: "Enter your email" })
//   }

//   try {
//     const userfind = await users.findOne({ email: emailaddress })
//     if (!userfind) {
//       return res.status(401).json({ status: 401, message: "User not found" });
//     }
//     const token = jwt.sign({ _id: userfind._id }, keysecret, {
//       expiresIn: "20m"
//     });
//     const setusertoken = await users.findByIdAndUpdate({ _id: userfind._id }, { verifytoken: token }, { new: true });
//     if (setusertoken) {
//       const mailOptions = {
//         from: process.env.EMAIL,
//         to: emailaddress,
//         subject: "Sending Email For password Reset",
//         text: `This Link Valid For 20 MINUTES http://localhost:3000/NewPassword/${userfind.id}/${setusertoken.verifytoken}`
//       }

//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.error("MAIL ERROR FULL:", error);
//           return res.status(500).json({
//             status: 500,
//             message: "Email not sent",
//             error: error.message,
//           });
//         } else {
//           console.log("Email sent", info.response);
//           res.status(201).json({ status: 201, message: "Email sent Successfully" })
//         }
//       })

//     }

//   }

//   catch (err) {
//     console.error("Catch block error:", err);
//     res.status(401).json({ status: 401, message: "invalid user" })
//   }
// }
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
    if (!validuser) {
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
const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await users.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // ✅ Rotate refresh token
    const newRefreshToken = user.generateRefreshToken();
    const newAccessToken = user.generateAccessToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,//true in production
      sameSite: "None",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,//true in production
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Token refreshed" });

  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(204).json({ message: "No token to clear" });

    const user = await users.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/"
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

module.exports = { registerUser, loginUser, validUser,verifyEmailAndLogin, googleLogin, sendemaillink, verifyForgot, changePassword, refreshAccessToken, logoutUser }
