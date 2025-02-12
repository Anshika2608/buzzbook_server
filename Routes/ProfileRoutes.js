const express=require("express")
const router = require("./TheaterRoutes")
const Router=express.Router()
const {updateProfile,deleteProfile,getProfile}=require("../Controllers/profileController")
Router.get("/get_profile",getProfile)
Router.put("/update_profile",updateProfile)
Router.delete("/delete_profile",deleteProfile)
module.exports=Router