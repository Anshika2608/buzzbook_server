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
    origin: ["http://localhost:3000"],
    credentials: true, 
  })
);
app.use(passport.initialize());
app.use("/auth", require("./Routes/AuthenticationRoute"));
app.use("/movie",require("./Routes/MovieRoutes"));
app.use("/theater",require("./Routes/TheaterRoutes"));
app.use("/showtime",require("./Routes/ShowtimeRoutes"))
app.use("/profile",require("./Routes/ProfileRoutes"))
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});