const express = require("express")
const router = express.Router();
const passport = require("passport")
require("dotenv").config();
const authenticate = require("../Middleware/Authenticate")
const { registerUser, loginUser, validUser, googleLogin, verifyForgot, sendemaillink, changePassword } = require("../Controllers/authenticationController")
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/validUser", authenticate, (req, res) => {
  console.log("✅ /validUser hit by:", req.rootUser.email);
  res.status(200).json({
    name: req.rootUser.name,
    email: req.rootUser.email,
    picture: req.rootUser.image || null,
  });
});
router.get("/google", 
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, userWithToken, info) => {
    if (err) return res.status(500).json({ message: "Error with Google login", error: err });

    if (!userWithToken || !userWithToken.token) {
      return res.status(401).json({ message: "Google login failed or token missing" });
    }

    const { user, token } = userWithToken;

    res.cookie("buzzbook_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 3600000,
    });

    console.log("✅ Google Callback Hit — Cookie set");
    res.redirect("http://localhost:5173/dashboard");
  })(req, res, next);
});





router.post("/sendpasswordLink", sendemaillink)

router.get("/ForgotPassword/:id/:token", verifyForgot)
router.post("/:id/:token", changePassword)
module.exports = router;