const express=require("express")
const router = require("./TheaterRoutes")
const Router=express.Router()
const {updateProfile,deleteProfile,getProfile}=require("../Controllers/profileController")
const authenticate = require("../Middleware/Authenticate")
Router.get("/getProfile",authenticate,getProfile)
Router.put("/update_profile", authenticate,updateProfile)
Router.delete("/delete_profile",authenticate,deleteProfile)
module.exports=Router