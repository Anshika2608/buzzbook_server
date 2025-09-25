const generateSeatsMiddleware = (req, res, next) => {
  const { audis } = req.body;

  if (!Array.isArray(audis) || audis.length === 0) {
    return res.status(400).json({ message: "Audis must be a non-empty array." });
  }

  try {
    req.body.audis = audis.map((audi, index) => {
      const {
        rows,
        seatsPerRow,
        layout_type,
        vipRows = 0,
        premiumRows = 0,
        sofaRows = 0,
        regularRows = 0,
        reclinerRows = 0,
        emptySpaces = [],
        films_showing = []
      } = audi;

      if (!rows || !seatsPerRow || !layout_type) {
        throw new Error(`Missing basic layout data in audi ${index + 1}`);
      }

      // Map of layout_type => expected seat types
      const layoutConfig = {
        standard: ["vipRows", "premiumRows", "regularRows"],
        luxury: ["sofaRows", "regularRows"],
        studio: ["regularRows"],
        recliner: ["reclinerRows", "regularRows"],
        balcony: ["premiumRows", "regularRows"]
      };

      const layoutKey = layout_type.toLowerCase();
      const expectedRowKeys = layoutConfig[layoutKey];

      if (!expectedRowKeys) {
        throw new Error(`Invalid layout type '${layout_type}' in audi ${index + 1}`);
      }

      // Build row-to-seatType mapping
      let rowTypeMapping = [];
      let totalRowSum = 0;

      for (const rowKey of expectedRowKeys) {
        const value = audi[rowKey] ?? 0;
        if (typeof value !== "number" || value < 0) {
          throw new Error(`Missing or invalid '${rowKey}' for layout '${layout_type}' in audi ${index + 1}`);
        }
        totalRowSum += value;
        rowTypeMapping.push(...Array(value).fill(rowKey.replace("Rows", "").toUpperCase()));
      }

      if (totalRowSum !== rows) {
        throw new Error(`Sum of seat type rows (${totalRowSum}) must match total rows (${rows}) in audi ${index + 1}`);
      }

      // Generate seating layout for each showtime of each film
      const updatedFilms = films_showing.map(film => {
        const updatedShowtimes = film.showtimes.map(showtime => {
          const seating_layout = generateLayout(rows, seatsPerRow, rowTypeMapping, emptySpaces);
          return {
            ...showtime,
            seating_layout
          };
        });

        return {
          ...film,
          showtimes: updatedShowtimes
        };
      });

      return {
        ...audi,
        films_showing: updatedFilms,
        seating_capacity: rows * seatsPerRow
      };
    });

    next();
  } catch (error) {
    return res.status(400).json({ message: "Error generating audi layouts", error: error.message });
  }
};

// Generates a seating layout grid based on row types and empty spaces
function generateLayout(rows, seatsPerRow, rowTypeMapping, emptySpaces) {
  const layout = [];

  for (let row = 0; row < rows; row++) {
    const rowLayout = [];
    const rowLetter = String.fromCharCode(65 + row);
    const seatType = rowTypeMapping[row];

    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatNumber = `${rowLetter}${seat}`;

      rowLayout.push({
        seat_number: seatNumber,
        type: emptySpaces.includes(`${row + 1}-${seat}`) ? "Empty" : seatType,
        is_booked: false,
        is_held: false,
        hold_expires_at: null
      });
    }

    layout.push(rowLayout);
  }

  return layout;
}

module.exports = generateSeatsMiddleware;
