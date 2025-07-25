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
        emptySpaces = []
      } = audi;

      if (!rows || !seatsPerRow || !layout_type) {
        throw new Error(`Missing basic layout data in audi ${index + 1}`);
      }

      let seat_types = [];
      let requiredTypes = [];

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

      // Validate presence and sum of expected row keys
      let totalRowSum = 0;
      for (const rowKey of expectedRowKeys) {
        const value = eval(rowKey); // e.g., vipRows
        if (!value || typeof value !== "number" || value < 0) {
          throw new Error(`Missing or invalid '${rowKey}' for layout '${layout_type}' in audi ${index + 1}`);
        }
        totalRowSum += value;

        // Collect seat type name from key (e.g., "vipRows" => "VIP")
        requiredTypes.push(rowKey.replace("Rows", ""));
        seat_types.push(...Array(value).fill(rowKey.replace("Rows", "").toUpperCase()));
      }

      if (totalRowSum !== rows) {
        throw new Error(`Sum of seat type rows (${totalRowSum}) must match total rows (${rows}) in audi ${index + 1}`);
      }

      // Generate seat layout grid
      let layout = [];
      generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

      return {
        ...audi,
        seating_layout: layout,
        seating_capacity: rows * seatsPerRow
      };
    });

    next();
  } catch (error) {
    return res.status(400).json({ message: "Error generating audi layouts", error: error.message });
  }
};



function generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout) {
  for (let row = 0; row < rows; row++) {
    let rowLayout = [];
    let rowLetter = String.fromCharCode(65 + row);

    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatNumber = `${rowLetter}${seat}`;
      const seatType = seat_types[row];

      if (emptySpaces.includes(`${row + 1}-${seat}`)) {
        rowLayout.push({
          seat_number: seatNumber,
          type: "Empty",
          is_booked: false,
          is_held: false,
          hold_expires_at: null
        });
      } else {
        rowLayout.push({
          seat_number: seatNumber,
          type: seatType,
          is_booked: false,
          is_held: false,
          hold_expires_at: null
        });
      }
    }

    layout.push(rowLayout);
  }
}


module.exports = generateSeatsMiddleware;
