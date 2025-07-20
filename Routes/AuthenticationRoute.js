const express = require("express")
const router = express.Router();
const passport = require("passport")
require("dotenv").config();
const authenticate = require("../Middleware/Authenticate")
const { registerUser, loginUser, validUser, googleLogin, verifyForgot, sendemaillink, changePassword } = require("../Controllers/authenticationController")
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/validUser", authenticate, validUser);
router.get("/auth/google", googleLogin);


router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false, // ✅ no session, we're using JWT
  }),
  (req, res) => {
    const { user, token } = req.user;

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("buzzbook_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 3600000,
    });

    const redirectUrl = isProd
      ? "https://your-frontend.vercel.app/dashboard"
      : "http://localhost:5173/dashboard";

    res.redirect(redirectUrl);
  }
);



router.post("/sendpasswordLink", sendemaillink)

router.get("/ForgotPassword/:id/:token", verifyForgot)
router.post("/:id/:token", changePassword)
module.exports = router;