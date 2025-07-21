const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");       
const GoogleUser = require("../Models/googleUser");       

const keysecret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
    try {
        console.log("🧪 AUTH triggered for route:", req.originalUrl);
        console.log("Token received:", req.cookies.buzzbook_token, req.headers.authorization);
        console.log("🔒 Authenticating...");

const token =
  req.headers.authorization?.replace("Bearer ", "") ||
  req.cookies.buzzbook_token ;

        console.log("Token from cookie/header:", token);
        if (!token) {
            return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, keysecret);
        const userId = decoded._id || decoded.id;
        console.log("✅ Token verified. Decoded ID:", userId);
        let user = await NormalUser.findById(userId);
        if (!user) {
            user = await GoogleUser.findById(userId);
        }
        if (!user) {
            return res.status(401).json({ status: 401, message: "User not found"});
        }
        if (user) {
            console.log("Authenticated user:", user.name);
        } else {
            console.log("No user found for ID:", userId);
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


