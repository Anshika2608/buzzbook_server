const express=require("express");
const generateSeatsMiddleware=require("../Middleware/SeatLayout.js")
const authenticate=require("../Middleware/Authenticate.js")
const { updateShowtime,addShowtime ,getShowtime,deleteShowtime} = require("../Controllers/showtimeControllers");
const router=express.Router();
// const authorizeAdmin = (req, res, next) => {
//   if (req.rootUser.role !== "admin") {
//     return res.status(403).json({ message: "Forbidden: Admins only" });
//   }
//   next();
// };

router.put("/update_showtime",authenticate,updateShowtime);
router.post("/add_showtime", authenticate, generateSeatsMiddleware, addShowtime);

router.get("/get_Showtime",authenticate,getShowtime)
router.delete("/delete_showtime",authenticate,deleteShowtime)
module.exports=router;