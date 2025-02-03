const express=require("express")
const router=express.Router();
const authenticate=require("../Middleware/Authenticate")
const {registerUser,loginUser,validUser}=require("../Controllers/authenticationController")
router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/validUser",authenticate,validUser);
module.exports=router;