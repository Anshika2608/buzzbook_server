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
                vipRows,
                premiumRows,
                sofaRows,
                regularRows,
                reclinerRows,
                emptySpaces
            } = audi;

            if (!rows || !seatsPerRow || !layout_type) {
                throw new Error(`Missing basic layout data in audi ${index + 1}`);
            }

            let layout = [];
            let seat_types = [];

            switch (layout_type.toLowerCase()) {
                case "standard":
                    if (!vipRows || !premiumRows || !regularRows) {
                        throw new Error(`'standard' layout requires vipRows, premiumRows, and regularRows`);
                    }
                    if (vipRows + premiumRows + regularRows !== rows) {
                        throw new Error(`Sum of vip, premium, and regular rows must match total rows`);
                    }
                    seat_types.push(...Array(vipRows).fill("VIP"));
                    seat_types.push(...Array(premiumRows).fill("Premium"));
                    seat_types.push(...Array(regularRows).fill("Regular"));
                    break;

                case "luxury":
                    if (!sofaRows || !regularRows) {
                        throw new Error(`'luxury' layout requires sofaRows and regularRows`);
                    }
                    if (sofaRows + regularRows !== rows) {
                        throw new Error(`Sum of sofa and regular rows must match total rows`);
                    }
                    seat_types.push(...Array(sofaRows).fill("Sofa"));
                    seat_types.push(...Array(regularRows).fill("Regular"));
                    break;

                case "studio":
                    if (!regularRows || regularRows !== rows) {
                        throw new Error(`'studio' layout requires regularRows equal to total rows`);
                    }
                    seat_types = Array(rows).fill("Regular");
                    break;

                case "recliner":
                    if (!reclinerRows || !regularRows) {
                        throw new Error(`'recliner' layout requires reclinerRows and regularRows`);
                    }
                    if (reclinerRows + regularRows !== rows) {
                        throw new Error(`Sum of recliner and regular rows must match total rows`);
                    }
                    seat_types.push(...Array(reclinerRows).fill("Recliner"));
                    seat_types.push(...Array(regularRows).fill("Regular"));
                    break;

                case "balcony":
                    if (!premiumRows || !regularRows) {
                        throw new Error(`'balcony' layout requires premiumRows and regularRows`);
                    }
                    if (premiumRows + regularRows !== rows) {
                        throw new Error(`Sum of premium and regular rows must match total rows`);
                    }
                    seat_types.push(...Array(regularRows).fill("Regular"));
                    seat_types.push(...Array(premiumRows).fill("Premium"));
                    break;

                default:
                    throw new Error(`Invalid layout type '${layout_type}' in audi ${index + 1}`);
            }

            // Generate layout and assign to the audi object
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces || [], layout);
            return {
                ...audi,
                seating_layout: layout,
                seating_capacity: rows * seatsPerRow
            };
        });

        next();
    } catch (error) {
        res.status(400).json({ message: "Error generating audi layouts", error: error.message });
    }
};

function generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout) {
    for (let row = 0; row < rows; row++) {
        let rowLayout = [];
        let rowLetter = String.fromCharCode(65 + row);

        for (let seat = 1; seat <= seatsPerRow; seat++) {
            let seatNumber = `${rowLetter}${seat}`;
            let seatType = seat_types[row];

            if (emptySpaces.includes(`${row + 1}-${seat}`)) {
                rowLayout.push({ seat_number: seatNumber, type: "Empty", is_booked: false });
            } else {
                rowLayout.push({ seat_number: seatNumber, type: seatType, is_booked: false });
            }
        }

        layout.push(rowLayout);
    }
}

module.exports = generateSeatsMiddleware;
