const express=require("express")
const router=express.Router();
const {registerUser}=require("../Controllers/authenticationController")
router.post("/register",registerUser);
module.exports=router;