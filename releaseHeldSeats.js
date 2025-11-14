const Theater = require("./Models/theaterModel");
const { getIO } = require("./socket");

setInterval(async () => {
  try {
    const theaters = await Theater.find({});

    for (const theater of theaters) {
      let updated = false;
      const releasedSeats = []; // ⭐ collect all seats that got released
      const io = getIO();

      for (const audi of theater.audis) {
        for (const film of audi.films_showing || []) {
          for (const show of film.showtimes || []) {
            for (const row of show.seating_layout || []) {
              for (const seat of row) {
                if (
                  seat.is_held &&
                  seat.hold_expires_at &&
                  new Date(seat.hold_expires_at) < new Date()
                ) {
                  releasedSeats.push(seat.seat_number); // ⭐ store seat
                  seat.is_held = false;
                  seat.hold_expires_at = null;
                  updated = true;
                }
              }
            }

            // ALSO emit by showtime (optional but useful)
            if (releasedSeats.length > 0) {
              io.emit("seatReleased", {
                theater_id: theater.theater_id,
                audi_number: audi.audi_number,
                movie_title: film.title,
                showtime: show.time,
                seats: releasedSeats, // ⭐ send seat numbers!!
              });

              console.log("Auto-release seats:", releasedSeats);
            }
          }
        }
      }

      if (updated) {
        await theater.save();
        console.log(`Released expired held seats in theater: ${theater.theater_id}`);
      }
    }
  } catch (error) {
    console.error("Auto-release error:", error.message);
  }
}, 10 * 1000);
