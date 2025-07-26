const mongoose = require("mongoose");
const Theater = require("../Models/theaterModel"); // Update path as needed

const holdSeats = async (req, res) => {
  const { theater_id, audi_number, movie_title, showtime, seats } = req.body;

  if (!theater_id || !audi_number || !movie_title || !showtime || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "All fields including seats array are required." });
  }

  try {
    const theater = await Theater.findOne({ theater_id });

    if (!theater) return res.status(404).json({ message: "Theater not found" });

    const audi = theater.audis.find(a => a.audi_number === audi_number);
    if (!audi) return res.status(404).json({ message: "Audi not found" });

    const film = audi.films_showing.find(f =>
      f.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
    );
    if (!film) return res.status(404).json({ message: "Movie not found in this audi" });

    const show = film.showtimes.find(s => s.time === showtime);
    if (!show) return res.status(404).json({ message: "Showtime not found" });

    const now = new Date();
    const holdExpiry = new Date(now.getTime() + 5 * 60000); // 5 minutes hold

    let heldSeats = [];

    for (let row of audi.seating_layout) {
      for (let seat of row) {
        if (seats.includes(seat.seat_number)) {
          if (seat.is_booked) {
            return res.status(400).json({ message: `Seat ${seat.seat_number} is already booked.` });
          }

          if (seat.is_held && seat.hold_expires_at > now) {
            return res.status(400).json({ message: `Seat ${seat.seat_number} is already held.` });
          }

          // Mark seat as held
          seat.is_held = true;
          seat.hold_expires_at = holdExpiry;
          heldSeats.push(seat.seat_number);
        }
      }
    }

    await theater.save();

    return res.status(200).json({
      message: "Seats held successfully",
      heldSeats,
      holdExpiresAt: holdExpiry
    });

  } catch (error) {
    console.error("Error holding seats:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = holdSeats;
