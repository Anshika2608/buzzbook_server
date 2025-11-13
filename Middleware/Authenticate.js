const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");
const GoogleUser = require("../Models/googleUser");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const authenticate = async (req, res, next) => {
  try {
    // 🔹 Get token from Authorization header ("Bearer <token>")
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
    }

    // 🔹 Verify access token
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const userId = decoded.id || decoded._id;

    // 🔹 Check both Normal and Google user collections
    let user = await NormalUser.findById(userId);
    let userType = "normal";

    if (!user) {
      user = await GoogleUser.findById(userId);
      userType = "google";
    }

    if (!user) {
      return res.status(401).json({ status: 401, message: "User not found" });
    }

    // 🔹 Attach to request object for downstream use
    req.userId = user._id;
    req.userType = userType;
    req.rootUser = user;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ status: 403, message: "Access token expired or invalid" });
  }
};

module.exports = authenticate;
