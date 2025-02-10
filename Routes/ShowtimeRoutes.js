const express=require("express");
const generateSeatsMiddleware=require("../Middleware/SeatLayout.js")
const { updateShowtime,addShowtime ,getShowtime} = require("../Controllers/showtimeControllers");
const router=express.Router();
router.put("/update_showtime",updateShowtime);
router.post("/add_showtime",generateSeatsMiddleware,addShowtime)
router.get("/get_Showtime",getShowtime)
module.exports=router;