const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const users = require("../Models/userModel");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://buzzbook-server-dy0q.onrender.com/auth/google/callback",
    },
    async (_, __, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await users.findOne({ email });

        if (user) {
          // Link Google to existing normal user
          if (!user.googleId) {
            user.googleId = profile.id;
            user.image = profile.photos[0].value;
            user.provider = "both";
            await user.save();
          }
        } else {
          // New Google-only user
          user = await users.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            image: profile.photos[0].value,
            provider: "google"
          });
        }

        // Generate Access + Refresh Tokens
        const accessJWT = user.generateAccessToken();
        const refreshJWT = user.generateRefreshToken();

        //  Save refresh token in DB
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