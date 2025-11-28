const Theater = require("../Models/theaterModel");
const { getIO } = require("../socket");
const Booking = require("../Models/BookingModel")
const TempBooking = require("../Models/TempBookingModel")
const Snack = require("../Models/snackModel")
// const holdSeats = async (req, res) => {
//   const { theater_id, movie_title, showtime, show_date, seats,parking_slot = null } = req.body;
//   const userId = req.userId;
//   const userEmail = req.rootUser.email;

//   if (!theater_id || !movie_title || !showtime || !Array.isArray(seats) || seats.length === 0) {
//     return res.status(400).json({ message: "Theater, movie, showtime and seats are required" });
//   }

//   try {
//     const theater = await Theater.findOne({ _id:theater_id });
//     if (!theater) return res.status(404).json({ message: "Theater not found" });

//     const date = show_date ? new Date(show_date) : new Date();
//     const formattedDate = date.toISOString().split("T")[0];

//     const audi = theater.audis.find(audi =>
//       audi.films_showing.some(film =>
//         film.title.toLowerCase() === movie_title.toLowerCase() &&
//         film.showtimes.some(s => s.time === showtime)
//       )
//     );
//     if (!audi) return res.status(404).json({ message: "Movie not found in any audi at this showtime" });

//     const film = audi.films_showing.find(f => f.title.toLowerCase() === movie_title.toLowerCase());
//     const show = film.showtimes.find(s => s.time === showtime);

//      // Check for already-held seats
//     const now = new Date();
//     const held = await TempBooking.find({
//       theater_id,
//       movie_title,
//       showtime,
//       show_date: formattedDate,
//       hold_expires_at: { $gt: now }
//     }).select("seats -_id");


//     const bookedFlat = bookedSeats.flatMap(b => b.seats);
//     for (let seat of seats) {
//       if (bookedFlat.includes(seat)) return res.status(400).json({ message: `Seat ${seat} is already held by someone else.` });
//     }

//     let seat_price_total = 0;
//     for (let seat of seats) {
//       let found = false;
//       for (let row of show.seating_layout) {
//         const seatObj = row.find(s => s.seat_number === seat);
//         if (seatObj) {
//           // normalize keys
//           const prices = Object.fromEntries(
//             Object.entries(show.prices).map(([k, v]) => [k.toUpperCase(), v])
//           );
//           seat_price_total += prices[seatObj.type.toUpperCase()] || 0;
//           found = true;
//           break;
//         }
//       }
//       if (!found) {
//         console.warn(`Seat ${seat} not found in layout`);
//       }
//     }


//     let snacks_total = 0;
//     const snacksDetails = [];
//     for (let s of snacks) {
//       const snack = await Snack.findById(s.snackId);
//       if (snack) {
//         const option = snack.quantity_options.find(q => q.unit === s.unit);
//         if (option) {
//           const price = option.price * s.quantity;
//           snacks_total += price;
//           snacksDetails.push({ snackId: snack._id, name: snack.name, unit: s.unit, quantity: s.quantity, price });
//         }
//       }
//     }

//     // let parking_price = 0;
//     // if (parking_slot) {
//     //   // example fixed price, you can make dynamic
//     //   parking_price = 50;
//     // }

//     // const total_price = seat_price_total + snacks_total + parking_price;
//     const total_price = seat_price_total + snacks_total;
//     const holdExpiry = new Date(now.getTime() + 7 * 60 * 1000);

//     const tempBooking = await TempBooking.create({
//       userId,
//       userEmail,
//       theater_id,
//       audi_number: audi.audi_number,
//       movie_title,
//       movie_language: film.language,
//       showtime,
//       show_date: formattedDate,
//       seats,
//       seat_price_total,
//       snacks: snacksDetails,
//       snacks_total,
//       parking_slot,
//       // parking_price,
//       total_price,
//       hold_expires_at: holdExpiry
//     });

//     // Emit socket to update other users
//     const io = getIO();
//     io.emit("seatHeld", {
//       theater_id,
//       audi_number: audi.audi_number,
//       movie_title,
//       showtime,
//       show_date,
//       seats
//     });

//     return res.status(200).json({
//       message: "Seats and extras held successfully",
//       tempBookingId: tempBooking._id,
//       seats,
//       holdExpiresAt: holdExpiry,
//       seat_price_total,
//       snacks_total,
//       // parking_price,
//       total_price
//     });

//   } catch (error) {
//     console.error("Error preparing payment:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// };
const holdSeats = async (req, res) => {
  const { theater_id, movie_title, showtime, show_date, seats } = req.body;
  const userId = req.userId;
  const userEmail = req.rootUser.email;

  if (!theater_id || !movie_title || !showtime || !seats?.length) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const theater = await Theater.findById(theater_id);
    if (!theater) return res.status(404).json({ message: "Theater not found" });

    const formattedDate = new Date(show_date).toISOString().split("T")[0];
    const audi = theater.audis.find(a =>
      a.films_showing.some(f =>
        f.title.toLowerCase() === movie_title.toLowerCase() &&
        f.showtimes.some(s => s.time === showtime)
      )
    );

    if (!audi) return res.status(404).json({ message: "Showtime not found" });

    const film = audi.films_showing.find(f => f.title.toLowerCase() === movie_title.toLowerCase());
    const show = film.showtimes.find(s => s.time === showtime);

    // Check for already-held seats
    const now = new Date();
    const held = await TempBooking.find({
      theater_id,
      movie_title,
      showtime,
      show_date: formattedDate,
      hold_expires_at: { $gt: now }
    }).select("seats -_id");

    const heldSeats = held.flatMap(b => b.seats);
    for (let seat of seats) {
      if (heldSeats.includes(seat)) {
        return res.status(400).json({ message: `Seat ${seat} is already held by someone else` });
      }
    }

    // Calculate seat price
    let seat_price_total = 0;
    const prices = Object.fromEntries(
      Object.entries(show.prices).map(([k, v]) => [k.toUpperCase(), v])
    );

    show.seating_layout.flat().forEach(seat => {
      if (seats.includes(seat.seat_number)) {
        seat_price_total += prices[seat.type.toUpperCase()] || 0;
      }
    });

    // Create temp booking (snacks empty initially)
    const holdExpiry = new Date(Date.now() + 7 * 60 * 1000);
    const tempBooking = await TempBooking.create({
      userId,
      userEmail,
      theater_id,
      audi_number: audi.audi_number,
      movie_title,
      movie_language: film.language,
      showtime,
      show_date: formattedDate,
      seats,
      seat_price_total,
      snacks: [],
      snacks_total: 0,
      total_price: seat_price_total,
      hold_expires_at: holdExpiry,
    });

    getIO().emit("seatHeld", {
      theater_id,
      audi_number: audi.audi_number,
      movie_title,
      showtime,
      show_date: formattedDate,
      seats,
      userId: String(userId)
    });

    res.status(200).json({
      message: "Seats held successfully",
      tempBookingId: tempBooking._id,
      seats,
      holdExpiresAt: holdExpiry,
      seat_price_total,
      snacks_total: 0,
      total_price: seat_price_total,
      userId: String(userId)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateTempBooking = async (req, res) => {
  const { tempBookingId, snacks = [] } = req.body;

  try {
    const temp = await TempBooking.findById(tempBookingId);
    if (!temp) return res.status(404).json({ message: "Temp booking not found" });

    temp.snacks = [];
    temp.snacks_total = 0;
    let snacks_total = 0;
    const snacksDetails = [];

    for (let s of snacks) {
      const snack = await Snack.findById(s.snackId);
      if (!snack) continue;

      const option = snack.quantity_options.find(q => q.unit === s.unit);
      if (!option) continue;

      const price = option.price * s.quantity;
      snacks_total += price;

      snacksDetails.push({
        snackId: snack._id,
        name: snack.name,
        unit: s.unit,
        quantity: s.quantity,
        price,
      });
    }

    temp.snacks = snacksDetails;
    temp.snacks_total = snacks_total;
    temp.total_price = temp.seat_price_total + snacks_total;

    await temp.save();

    res.status(200).json({
      message: "Snacks updated",
      snacks: snacksDetails,
      snacks_total,
      total_price: temp.total_price,
    });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const releaseTempBooking = async (req, res) => {
  console.log("🔥 releaseTempBooking API HIT");
  const { tempBookingId } = req.body;
  const userId = req.userId;
  try {
    const temp = await TempBooking.findById(tempBookingId);
    if (!temp) return res.status(404).json({ message: "Temp booking not found" });

    const { theater_id, audi_number, movie_title, showtime, show_date, seats } = temp;
    console.log("📌 BEFORE EMIT seatReleased");
    // Release seats in socket
    getIO().emit("seatReleased", {
      theater_id,
      audi_number,
      movie_title,
      showtime,
      show_date,
      seats,
      userId
    });
    console.log("📌 AFTER EMIT seatReleased");
    console.log("🔥 Emitted seatReleased for seats:", seats);
    // Delete the temp booking
    await TempBooking.findByIdAndDelete(tempBookingId);

    res.status(200).json({ message: "Temp booking released", seats });

  } catch (err) {
    console.error("Release error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateSeats = async (req, res) => {
  const { tempBookingId, seats, show_date } = req.body;

  if (!tempBookingId || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const temp = await TempBooking.findById(tempBookingId);
    if (!temp) return res.status(404).json({ message: "Temp booking not found" });

    const userId = req.userId; // <<--- GET USER ID HERE

    const {
      theater_id,
      movie_title,
      showtime,
      audi_number
    } = temp;

    const formattedDate = new Date(show_date).toISOString().split("T")[0];

    const theater = await Theater.findById(theater_id);
    if (!theater) return res.status(404).json({ message: "Theater not found" });

    const audi = theater.audis.find(a => a.audi_number === audi_number);
    const film = audi.films_showing.find(f => f.title.toLowerCase() === movie_title.toLowerCase());
    const show = film.showtimes.find(s => s.time === showtime);

    const now = new Date();

    // ******** RELEASE OLD SEATS ********
    getIO().emit("seatReleased", {
      theater_id,
      audi_number,
      movie_title,
      showtime,
      show_date: formattedDate,
      seats: temp.seats,
      userId          // <<--- SEND USER ID
    });

    // ******** CHECK NEW SEATS ********
    const held = await TempBooking.find({
      theater_id,
      movie_title,
      showtime,
      show_date: formattedDate,
      hold_expires_at: { $gt: now },
      _id: { $ne: tempBookingId }
    }).select("seats -_id");

    const heldSeats = held.flatMap(b => b.seats);

    for (let seat of seats) {
      if (heldSeats.includes(seat)) {
        return res.status(400).json({ message: `Seat ${seat} is already held by someone else` });
      }
    }

    // ******** CALCULATE NEW PRICE ********
    let seat_price_total = 0;
    const prices = Object.fromEntries(
      Object.entries(show.prices).map(([k, v]) => [k.toUpperCase(), v])
    );

    show.seating_layout.flat().forEach(seatData => {
      if (seats.includes(seatData.seat_number)) {
        seat_price_total += prices[seatData.type.toUpperCase()] || 0;
      }
    });

    // ******** UPDATE TEMP BOOKING ********
    temp.seats = seats;
    temp.seat_price_total = seat_price_total;
    temp.total_price = seat_price_total + temp.snacks_total;
    temp.hold_expires_at = new Date(Date.now() + 7 * 60 * 1000);

    await temp.save();

    // ******** EMIT NEW HOLD ********
    getIO().emit("seatHeld", {
      theater_id,
      audi_number,
      movie_title,
      showtime,
      show_date: formattedDate,
      seats,
      userId: String(userId)
    });

    res.status(200).json({
      message: "Seats updated successfully",
      seats,
      seat_price_total,
      snacks_total: temp.snacks_total,
      total_price: temp.total_price,
      hold_expires_at: temp.hold_expires_at,
      tempBookingId
    });

  } catch (error) {
    console.error("Update seats error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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

  const user_id = req.userId;
  const user_email = req.rootUser.email;

  if (
    !theater_id || !audi_number || !movie_title || !movie_language ||
    !showtime || !show_date || !Array.isArray(seats) || seats.length === 0 ||
    !paymentId || !total_price
  ) {
    return res.status(400).json({ message: "All required fields must be provided." });
  }

  try {

    const theater = await Theater.findById(theater_id );
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
    let bookedSeats = [];

    for (let row of show.seating_layout) {
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

    const newBooking = new Booking({
      user_id,
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

    const io = getIO();
    io.emit("seatsBooked", {
      theaterId: theater.theater_id,
      audi_number,
      movie_title,
      showtime,
      bookedSeats,
    });

    return res.status(200).json({
      success:true,
      message: "Booking confirmed successfully",
      booking: newBooking,
      user_email,
    });

  } catch (error) {
    console.error("Error confirming booking:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports = { holdSeats, confirmBooking, updateTempBooking, releaseTempBooking, updateSeats };
