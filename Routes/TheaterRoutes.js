const express=require("express");
const { getTheater, addTheater,getSeatLayout, getTheaterForMovie, bookSeat,deleteTheater,addAudi } = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const authenticate=require("../Middleware/Authenticate")
const router=express.Router();
router.get("/theater_list",authenticate,getTheater);
router.post("/add_theater",authenticate,generateSeatsMiddleware,addTheater);
router.get("/seat_layout",authenticate,getSeatLayout)
router.get("/get_theater",getTheaterForMovie)
router.put("/seatBook",bookSeat);
router.delete("/delete_theater/:theater_id",authenticate,deleteTheater)
router.post("/addAudi", generateSeatsMiddleware, addAudi);
module.exports=router;
