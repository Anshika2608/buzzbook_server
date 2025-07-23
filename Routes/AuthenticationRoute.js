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
    if (err || !userWithToken || !userWithToken.token) {
      return res.redirect("http://localhost:3000/login?error=google_login_failed");
    }

    const { token } = userWithToken;
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    return res.redirect("http://localhost:3000/dashboard");
  })(req, res, next);
});
router.get("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "Strict",
    secure: true,
  });
  res.status(200).json({ message: "Logged out" });
});









router.post("/sendpasswordLink", sendemaillink)

router.get("/ForgotPassword/:id/:token", verifyForgot)
router.post("/:id/:token", changePassword)
module.exports = router;