const express=require("express");
const { getTheater, addTheater } = require("../Controllers/theaterController");
const router=express.Router();
router.get("/theater_list",getTheater);
router.post("/add_theater",addTheater);
module.exports=router;
