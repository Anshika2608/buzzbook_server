const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const users = require("../Models/googleUser");
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://buzzbook-server-dy0q.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await users.findOne({ googleId: profile.id });

        if (!user) {
          user = new users({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            image: profile.photos[0].value,
          });
          await user.save();
        }

        // ✅ Generate Access + Refresh Tokens
        const accessJWT = jwt.sign({ id: user._id }, ACCESS_SECRET, { expiresIn: "15m" });
        const refreshJWT = jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: "7d" });

        // ✅ Save refresh token in DB
        user.refreshToken = refreshJWT;
        await user.save();

        return done(null, { user, accessJWT, refreshJWT });
      } catch (err) {
        console.error("Google strategy error:", err);
        return done(err, null);
      }
    }
  )
);
module.exports = passport;