const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      console.log("❌ No access token in cookie");
      return res.status(401).json({ message: "No access token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Access token expired or invalid" });
    }

    const userId = decoded.id;

    if (!userId)
      return res.status(403).json({ message: "Invalid token payload" });
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.userId = user._id.toString();
    req.rootUser = user;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ status: 403, message: "Access token expired or invalid" });
  }
};

module.exports = authenticate;

const requireEmailVerified = (req, res, next) => {
  if (!req.rootUser.emailVerified) {
    return res.status(403).json({
      message: "Please verify your email to continue",
    });
  }
  next();
};
module.exports = requireEmailVerified

