const jwt = require("jsonwebtoken");
const NormalUser = require("../Models/userModel");       
const GoogleUser = require("../Models/googleUser");       

const keysecret = process.env.SECRET_KEY;

const authenticate = async (req, res, next) => {
    try {
        console.log("🔒 Authenticating...");

        const token = req.cookies.buzzbook_token || req.headers.authorization;
        console.log("Token from cookie/header:", token);
        if (!token) {
            return res.status(401).json({ status: 401, message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, keysecret);
        console.log("✅ Token verified. Decoded ID:", decoded.id);
        
        let user = await NormalUser.findById(decoded.id);
        if (!user) {
            user = await GoogleUser.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({ status: 401, message: "User not found" });
        }
        if (user) {
            console.log("✅ Authenticated user:", user.name);
        } else {
            console.log("❌ No user found for ID:", decoded.id);
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
