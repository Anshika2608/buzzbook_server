const Theater = require("../Models/theaterModel");
const { getIO } = require("../socket");
const Booking=require("../Models/BookingModel")
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
    const holdExpiry = new Date(now.getTime() + 7 * 60000); // 5 minutes hold
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
async function verifyPayment(paymentId) {

  if (paymentId && paymentId.startsWith("pay_")) {
    return true;
  }
  return false;
}




const confirmBooking = async (req, res) => {
  const {
    theater_id,
    audi_number,
    movie_title,
    movie_language,
    showtime,
    show_date,
    seats,
    paymentId,
    seat_price_total,
    snacks = [],
    snacks_total = 0,
    parking_slot = null,
    total_price,
  } = req.body;

  // const user_id = req.userId;       // ✅ from middleware
  // const user_email = req.rootUser.email; // ✅ also available

  if (
    !theater_id || !audi_number || !movie_title || !movie_language ||
    !showtime || !show_date || !Array.isArray(seats) || seats.length === 0 ||
    !paymentId || !total_price
  ) {
    return res.status(400).json({ message: "All required fields must be provided." });
  }

  try {
   
    const isPaymentValid = await verifyPayment(paymentId);
    if (!isPaymentValid) {
      return res.status(400).json({ message: "Payment verification failed." });
    }

    
    const theater = await Theater.findOne({ theater_id });
    if (!theater) return res.status(404).json({ message: "Theater not found" });

    // 3️⃣ locate audi
    const audi = theater.audis.find(a => a.audi_number === audi_number);
    if (!audi) return res.status(404).json({ message: "Audi not found" });

    // 4️⃣ locate movie
    const film = audi.films_showing.find(f =>
      f.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
    );
    if (!film) return res.status(404).json({ message: "Movie not found in this audi" });

    // 5️⃣ validate showtime
    const show = film.showtimes.find(s => s.time === showtime);
    if (!show) return res.status(404).json({ message: "Showtime not found" });

    const now = new Date();
    let bookedSeats = [];

    // 6️⃣ mark seats as booked
    for (let row of audi.seating_layout) {
      for (let seat of row) {
        if (seats.includes(seat.seat_number)) {
          if (seat.is_booked) {
            return res.status(400).json({ message: `Seat ${seat.seat_number} is already booked.` });
          }
          if (seat.is_held && seat.hold_expires_at < now) {
            return res.status(400).json({ message: `Seat ${seat.seat_number} hold expired.` });
          }

          seat.is_booked = true;
          seat.is_held = false;
          seat.hold_expires_at = null;
          bookedSeats.push(seat.seat_number);
        }
      }
    }

    await theater.save();

    // 7️⃣ save booking in Booking collection
    const newBooking = new Booking({
      // user_id,
      theater_id: theater._id,
      theater_name: theater.name,
      audi_number,
      movie_title,
      movie_language,
      showtime,
      show_date,
      seats: bookedSeats,
      seat_price_total,
      snacks,
      snacks_total,
      parking_slot,
      total_price,
      status: "confirmed",
      payment_status: "paid",
    });

    await newBooking.save();

    // 8️⃣ emit socket event
    const io = getIO();
    io.emit("seatsBooked", {
      theaterId: theater.theater_id,
      audi_number,
      movie_title,
      showtime,
      bookedSeats,
    });

    return res.status(200).json({
      message: "Booking confirmed successfully",
      booking: newBooking,
      // user_email, // ✅ can also return email for frontend display
    });

  } catch (error) {
    console.error("Error confirming booking:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports = { holdSeats,confirmBooking };
