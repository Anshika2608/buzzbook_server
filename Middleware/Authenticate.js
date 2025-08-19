const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");
const GoogleUser = require("../Models/googleUser");
const keysecret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, keysecret);
    const userId = decoded._id || decoded.id;
    let user = await NormalUser.findById(userId);
    let userType = "normal";

    if (!user) {
      user = await GoogleUser.findById(userId);
      userType = "google";
    }

    if (!user) {
      return res
        .status(401)
        .json({ status: 401, message: "User not found" });
    }


    req.token = token;
    req.rootUser = user;
    req.userId = user._id;
    req.userType = userType; 

    next();
  } catch (error) {
    return res.status(401).json({ status: 401, message: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticate;
