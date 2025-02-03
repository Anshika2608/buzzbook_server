const express=require("express")
const router=express.Router();
const passport=require("passport")
require("dotenv").config();
const authenticate=require("../Middleware/Authenticate")
const {registerUser,loginUser,validUser,googleLogin}=require("../Controllers/authenticationController")
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/validUser",authenticate,validUser);
router.get("/auth/google",googleLogin);


router.get("/auth/google/callback",
    passport.authenticate("google", { 
        
        failureRedirect: "/login",
        successRedirect:"/dashboard" }),
);
module.exports=router;