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
  passport.authenticate("google", { session: false }, (err, userWithToken) => {
    console.log("🔥 Callback route hit");

    if (err || !userWithToken || !userWithToken.token) {
      console.error("❌ Google login error or missing token:", err, userWithToken);
      return res.redirect("http://localhost:5173/?error=google_login_failed");
    }

    const { token } = userWithToken;
    console.log("✅ Google login successful");
    console.log("🔑 Generated Token:", token);

    // ✅ Redirect to frontend with token in query param
    res.redirect(`http://localhost:5173/google-redirect.html?token=${token}`);
  })(req, res, next);
});









router.post("/sendpasswordLink", sendemaillink)

router.get("/ForgotPassword/:id/:token", verifyForgot)
router.post("/:id/:token", changePassword)
module.exports = router;