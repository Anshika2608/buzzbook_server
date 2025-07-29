const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { initSocket } = require("./socket");

require("./config/config");
const cookieParser = require("cookie-parser");
const passport = require("./Middleware/PassPort");
const cors = require("cors");
const path = require("path");

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:5173",
      "https://buzzbook-rho.vercel.app",
      "https://buzzbook-project.vercel.app",
      "https://buzzbook-project-bab3.vercel.app"
    ],
    credentials: true,
  })
);

app.use(passport.initialize());

app.use("/auth", require("./Routes/AuthenticationRoute"));
app.use("/location", require("./Routes/LocationRoutes"));
app.use("/movie", require("./Routes/MovieRoutes"));
app.use("/theater", require("./Routes/TheaterRoutes"));
app.use("/showtime", require("./Routes/ShowtimeRoutes"));
app.use("/profile", require("./Routes/ProfileRoutes"));
app.use("/booking", require("./Routes/BookingRoutes"));


initSocket(server);


require("./releaseHeldSeats");

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
