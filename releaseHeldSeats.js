// Auto-release based on TempBooking TTL
const TempBooking = require("./Models/TempBookingModel");
const { getIO } = require("./socket");

setInterval(async () => {
  try {
    const now = new Date();

    // Find expired holds
    const expired = await TempBooking.find({
      hold_expires_at: { $lt: now }
    });

    if (expired.length === 0) return;

    const io = getIO();

    for (const temp of expired) {
      io.emit("seatReleased", {
        theater_id: temp.theater_id,
        audi_number: temp.audi_number,
        movie_title: temp.movie_title,
        showtime: temp.showtime,
        show_date: temp.show_date,
        seats: temp.seats,
        userId: String(temp.userId)
      });

      console.log("⏳ Auto released seats:", temp.seats);

      await TempBooking.findByIdAndDelete(temp._id);
    }
  } catch (err) {
    console.error("Auto-release error:", err);
  }
}, 10 * 1000); // every 10 seconds
