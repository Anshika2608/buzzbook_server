const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");
const GoogleUser = require("../Models/googleUser");
const keysecret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    console.log("🛡️ Auth middleware — Received Token:", token);

    if (!token) {
      console.warn("🚫 No token provided");
      return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, keysecret);
    console.log("✅ Token Decoded:", decoded);

    const userId = decoded._id || decoded.id;
    console.log("🔍 Looking up user with ID:", userId);

    let user = await NormalUser.findById(userId) || await GoogleUser.findById(userId);
    if (!user) {
      console.warn("❌ User not found for decoded ID");
      return res.status(401).json({ status: 401, message: "User not found" });
    }

    console.log("✅ Authenticated User:", user.email || user.name);

    req.token = token;
    req.rootUser = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    res.status(401).json({ status: 401, message: "Unauthorized: Invalid token" });
  }
};


module.exports = authenticate;
