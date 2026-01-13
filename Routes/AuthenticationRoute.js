const express = require("express")
const router = express.Router();
const passport = require("passport")
require("dotenv").config();
const authenticate = require("../Middleware/Authenticate")
const { registerUser, loginUser, validUser, googleLogin, verifyForgot, sendemaillink, changePassword, refreshAccessToken, logoutUser } = require("../Controllers/authenticationController")
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/refresh-token",refreshAccessToken)
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
  passport.authenticate("google", { session: false }, (err, data) => {
    if (err || !data || !data.accessJWT) {
      return res.redirect("https://buzzbook-project.vercel.app/login");
    }

    const { accessJWT, refreshJWT } = data;
      res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 15 * 60 * 1000,
      overwrite: true,
    });
    res.cookie("refreshToken", refreshJWT, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("https://buzzbook-project.vercel.app/");
  })(req, res, next);
});

router.post("/logout",logoutUser)
router.post("/sendpasswordLink", sendemaillink)

router.get("/ForgotPassword/:id/:token", verifyForgot)
router.post("/:id/:token", changePassword)

module.exports = router;