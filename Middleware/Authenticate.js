const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");        // Email-password users
const GoogleUser = require("../Models/googleUser");       // Google login users

const keysecret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.buzzbook_token || req.headers.authorization;
    if (!token) {
      return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, keysecret);

    // Try finding the user in both collections
    let user = await NormalUser.findById(decoded.id);
    if (!user) {
      user = await GoogleUser.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ status: 401, message: "User not found" });
    }

    req.token = token;
    req.rootUser = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ status: 401, message: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticate;
