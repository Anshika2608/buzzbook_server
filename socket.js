// socket.js
const { Server } = require("socket.io");
const TempBooking = require("./Models/TempBookingModel");
const Theater = require("./Models/theaterModel");
const User = require("./Models/userModel")
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5000",
        "http://localhost:5173",
        "https://buzzbook-rho.vercel.app",
        "https://buzzbook-project.vercel.app",
        "https://buzzbook-project-bab3.vercel.app"
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔥 Socket connected:", socket.id);
    const origEmit = io.emit;
    io.emit = function (event, ...args) {
      console.log("📡 SERVER SENT EVENT =>", event, JSON.stringify(args, null, 2));
      return origEmit.apply(io, [event, ...args]);
    };
    // ==========================
    // USER SELECTS A SEAT
    // ==========================
    socket.on("selectSeat", async (data) => {
      try {
        const {
          theater_id,
          movie_title,
          showtime,
          show_date,
          seat,
          userId,
        } = data;

        console.log("🟣 BACKEND RECEIVED selectSeat:", data);

        const formattedDate = new Date(show_date).toISOString().split("T")[0];

        // 1️⃣ Fetch theater
        const theater = await Theater.findById(theater_id);
        if (!theater) return;

        // 2️⃣ Find audi + movie + showtime
        const audi = theater.audis.find(a =>
          a.films_showing.some(f =>
            f.title.toLowerCase() === movie_title.toLowerCase() &&
            f.showtimes.some(s => s.time === showtime)
          )
        );
        if (!audi) return;

        const film = audi.films_showing.find(
          f => f.title.toLowerCase() === movie_title.toLowerCase()
        );
        const show = film.showtimes.find(s => s.time === showtime);

        // 3️⃣ Fetch userEmail (NormalUser || GoogleUser)
        const user = await User.findById(userId);
        const userEmail = user.email ;

        if (!userEmail) {
          console.log("❌ User not found");
          return;
        }

        // 4️⃣ Find/Update temp booking
        let temp = await TempBooking.findOne({
          userId,
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate
        });

        if (!temp) {
          temp = await TempBooking.create({
            userId,
            userEmail,
            theater_id,
            audi_number: audi.audi_number,
            movie_title,
            movie_language: film.language,
            showtime,
            show_date: formattedDate,
            seats: [seat],
            seat_price_total: 0,
            snacks: [],
            snacks_total: 0,
            total_price: 0,
            hold_expires_at: new Date(Date.now() + 7 * 60 * 1000)
          });
        } else {
          if (!temp.seats.includes(seat)) {
            temp.seats.push(seat);
            await temp.save();
          }
        }

        // 5️⃣ Emit new held seat
        io.emit("seatHeld", {
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate,
          seats: [seat],
          userId
        });

      } catch (err) {
        console.error("❌ Error selecting seat:", err);
      }
    });


    // ==========================
    // USER DESELECTS A SEAT
    // ==========================
    socket.on("deselectSeat", async (data) => {
      console.log("⚪ BACKEND RECEIVED deselectSeat:", data);
      try {
        const {
          theater_id,
          movie_title,
          showtime,
          show_date,
          seat,
          userId,
        } = data;

        const formattedDate = new Date(show_date).toISOString().split("T")[0];

        let temp = await TempBooking.findOne({
          userId,
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate
        });

        if (temp) {
          temp.seats = temp.seats.filter((s) => s !== seat);
          await temp.save();
        }
        console.log("♻️ EMITTING seatReleased:", seat, "from user", userId);
        // Notify all clients
        io.emit("seatReleased", {
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate,
          seats: [seat],
          userId,
        });
      } catch (err) {
        console.error("❌ Error deselecting seat:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = { initSocket, getIO };
