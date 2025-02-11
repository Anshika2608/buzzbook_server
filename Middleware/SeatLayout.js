const generateSeatsMiddleware = (req, res, next) => {
    const { rows, seatsPerRow, layout_type, vipRows, premiumRows, sofaRows, regularRows, reclinerRows, emptySpaces } = req.body;
    let layout = [];

    try {
        if (layout_type === "standard") {
            if (!vipRows || !premiumRows || !regularRows) {
                return res.status(400).json({ message: "For 'standard' layout, 'vipRows', 'premiumRows', and 'regularRows' must be provided." });
            }
            if(vipRows+premiumRows+regularRows!== rows){
                return res.status(400).json({message:"Sum of vip,premium and regular rows does not matches total rows!"})
            }

            let seat_types = [];
            seat_types.push(...Array(vipRows).fill("VIP"));
            seat_types.push(...Array(premiumRows).fill("Premium"));
            seat_types.push(...Array(regularRows).fill("Regular"));
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

        } else if (layout_type === "luxury") {

            if (!sofaRows || !regularRows) {
                return res.status(400).json({ message: "For 'luxury' layout, 'sofaRows' and 'regularRows' must be provided." });
            }
            if(sofaRows+regularRows!== rows){
                return res.status(400).json({message:"Sum of sofaRows and regularRows does not matches total rows!"})
            }

            let seat_types = [];
            seat_types.push(...Array(sofaRows).fill("Sofa"));
            seat_types.push(...Array(regularRows).fill("Regular"));
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

        } else if (layout_type === "studio") {
            
            if (!regularRows) {
                return res.status(400).json({ message: "For 'studio' layout, 'regularRows' must be provided." });
            }
            if(regularRows!== rows){
                return res.status(400).json({message:"number of  regularRows does not matches total rows!"})
            }

            let seat_types = Array(rows * seatsPerRow).fill("Regular");
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

        } else if (layout_type === "recliner") {
            
            if (!reclinerRows || !regularRows) {
                return res.status(400).json({ message: "For 'recliner' layout, 'reclinerRows' and 'regularRows' must be provided." });
            }
            if(reclinerRows+regularRows!== rows){
                return res.status(400).json({message:"Sum of reclinerRows and regularRows does not matches total rows!"})
            }

            let seat_types = [];
            seat_types.push(...Array(reclinerRows).fill("Recliner"));
            seat_types.push(...Array(regularRows).fill("Regular"));
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

        } else if (layout_type === "balcony") {
            
            if (!regularRows || !premiumRows) {
                return res.status(400).json({ message: "For 'balcony' layout, 'regularRows' and 'premiumRows' must be provided." });
            }
            if(premiumRows+regularRows!== rows){
                return res.status(400).json({message:"Sum of premiumRows and regularRows does not matches total rows!"})
            }

            let seat_types = [];
            seat_types.push(...Array(regularRows).fill("Regular"));
            seat_types.push(...Array(premiumRows).fill("Premium"));
            generateLayout(rows, seatsPerRow, seat_types, emptySpaces, layout);

        } else {
            return res.status(400).json({ message: "Invalid layout type" });
        }

       
        req.body.seating_layout = layout;
        next(); 

    } catch (error) {
        res.status(500).json({ success: false, message: "Error generating seating layout", error: error.message });
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
