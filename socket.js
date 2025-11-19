// socket.js
const { Server } = require("socket.io");
const TempBooking = require("./Models/TempBookingModel");

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

        const formattedDate = new Date(show_date).toISOString().split("T")[0];

        // find or create temp booking for this user
        let temp = await TempBooking.findOne({
          userId,
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate
        });

        if (!temp) {
          // Create a new temp booking
          temp = await TempBooking.create({
            userId,
            theater_id,
            movie_title,
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
          // Add seat if not already present
          if (!temp.seats.includes(seat)) {
            temp.seats.push(seat);
            await temp.save();
          }
        }

        // Notify all frontend clients
        io.emit("seatHeld", {
          theater_id,
          movie_title,
          showtime,
          show_date: formattedDate,
          seats: [seat],
          userId,
        });

      } catch (err) {
        console.error("❌ Error selecting seat:", err);
      }
    });

    // ==========================
    // USER DESELECTS A SEAT
    // ==========================
    socket.on("deselectSeat", async (data) => {
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
