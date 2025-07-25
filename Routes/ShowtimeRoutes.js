const express=require("express");
const generateSeatsMiddleware=require("../Middleware/SeatLayout.js")
const authenticate=require("../Middleware/Authenticate.js")
const { updateShowtime,addShowtime ,getShowtime,deleteShowtime} = require("../Controllers/showtimeControllers");
const router=express.Router();
router.put("/update_showtime",authenticate,updateShowtime);
router.post("/add_showtime",authenticate, addShowtime);
router.get("/get_Showtime",authenticate,getShowtime)
router.delete("/delete_showtime",deleteShowtime)

module.exports=router;