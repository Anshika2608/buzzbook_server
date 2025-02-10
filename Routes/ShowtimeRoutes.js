const express=require("express");
const { updateShowtime } = require("../Controllers/showtimeControllers");
const router=express.Router();
router.put("/update_showtime",updateShowtime);
module.exports=router;