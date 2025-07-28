const express = require("express");
const app = express();
require("./config/config");
const cookieParser = require("cookie-parser");
const passport = require("./Middleware/PassPort");
const cors = require("cors");
app.use(express.json());
app.use(cookieParser());
const session = require('express-session');
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
const port = process.env.PORT || 3000;
app.use(
  cors({
    origin: ["http://localhost:3000",
      "https://buzzbook-rho.vercel.app",
      "buzzbook-project.vercel.app",
      "buzzbook-project-bab3.vercel.app"
    ],
    credentials: true, 
  })
);
app.use(passport.initialize());
app.use("/auth", require("./Routes/AuthenticationRoute"));
app.use("/location", require("./Routes/LocationRoutes"));
app.use("/movie",require("./Routes/MovieRoutes"));
app.use("/theater",require("./Routes/TheaterRoutes"));
app.use("/showtime",require("./Routes/ShowtimeRoutes"))
app.use("/profile",require("./Routes/ProfileRoutes"))
app.use("/booking",require("./Routes/BookingRoutes"))
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Auto-release expired held seats every 1 minute
// const Theater = require("./Models/theaterModel");

// setInterval(async () => {
//   try {
//     const theaters = await Theater.find({});

//     for (const theater of theaters) {
//       let updated = false;

//       for (const audi of theater.audis) {
//         for (const row of audi.seating_layout) {
//           for (const seat of row) {
//             if (
//               seat.is_held &&
//               seat.hold_expires_at &&
//               new Date(seat.hold_expires_at) < new Date()
//             ) {
//               seat.is_held = false;
//               seat.hold_expires_at = null;
//               updated = true;
//             }
//           }
//         }
//       }

//       if (updated) {
//         await theater.save();
//         console.log(`Released expired held seats in theater: ${theater.theater_id}`);
//       }
//     }
//   } catch (error) {
//     console.error("Error auto-releasing held seats:", error.message);
//   }
// }, 60 * 1000);

