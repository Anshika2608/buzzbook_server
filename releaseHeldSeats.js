const Theater = require("./Models/theaterModel");
const { getIO } = require("./socket");

setInterval(async () => {
  try {
    const theaters = await Theater.find({});

    for (const theater of theaters) {
      let updated = false;

      for (const audi of theater.audis) {
        for (const film of audi.films_showing || []) {
          for (const showtime of film.showtimes || []) {
            for (const row of showtime.seating_layout || []) {
              for (const seat of row) {
                if (
                  seat.is_held &&
                  seat.hold_expires_at &&
                  new Date(seat.hold_expires_at) < new Date()
                ) {
                  seat.is_held = false;
                  seat.hold_expires_at = null;
                  updated = true;
                }
              }
            }
          }
        }
      }

      if (updated) {
        await theater.save();
        console.log(`Released expired held seats in theater: ${theater.theater_id}`);
        const io = getIO();
        io.emit("seatReleased", {
          theaterId: theater.theater_id,
          message: "Seats released due to timeout"
        });
      }
    }
  } catch (error) {
    console.error("Auto-release error:", error.message);
  }
}, 10 * 1000);
