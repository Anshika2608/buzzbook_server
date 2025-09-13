const express=require("express");
const { getTheater, addTheater,getSeatLayout, getTheaterForMovie, bookSeat,deleteTheater,getUniqueLanguagesInCity,addAudi, addFilmToAudi ,getTheaterById, getPriceRangesForMovie,filterTheatersByMovieCityAndPrice} = require("../Controllers/theaterController");
const generateSeatsMiddleware = require("../Middleware/SeatLayout");
const authenticate=require("../Middleware/Authenticate")
const router=express.Router();
router.get("/theater_list",getTheater);
router.post("/add_theater",generateSeatsMiddleware,addTheater);
router.get("/seat_layout",getSeatLayout)
router.get("/get_theater",getTheaterForMovie)
router.put("/seatBook",bookSeat);
router.delete("/delete_theater/:theater_id",authenticate,deleteTheater)
router.post("/addAudi", generateSeatsMiddleware, addAudi);
router.post("/addFilmToAudi",addFilmToAudi);
router.get("/prices",getPriceRangesForMovie),
router.get("/getUniqueLanguages",getUniqueLanguagesInCity)
router.get("/filterTheaters",filterTheatersByMovieCityAndPrice)
router.get("/:id", getTheaterById);
module.exports=router;
