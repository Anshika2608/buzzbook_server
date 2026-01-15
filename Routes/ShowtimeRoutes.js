const express=require("express");
const generateSeatsMiddleware=require("../Middleware/SeatLayout.js")
const {authenticate}=require("../Middleware/Authenticate.js")
const { updateShowtime,addShowtime ,getShowtime,deleteShowtime,getShowtimeRangesByCityAndMovie,filterTheatersByShowtimeRange} = require("../Controllers/showtimeControllers");
const router=express.Router();
router.patch("/update_showtime",authenticate,updateShowtime);
router.post("/add_showtime",authenticate, addShowtime);
router.get("/get_Showtime",getShowtime)
router.delete("/delete_showtime",authenticate,deleteShowtime)
router.get("/uniqueShowtime",getShowtimeRangesByCityAndMovie)
router.get("/filterShowtime",filterTheatersByShowtimeRange)

module.exports=router;