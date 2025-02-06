const theater = require("../Models/theaterModel");
const getTheater = async (req, res) => {
    try {
        const { location } = req.params;
        const theaters = await theater.find({ location })
        if (!theaters.length) {
            return res.status(400).json({ message: `No theater available at this ${location}` })
        }
        else {
            return res.status(201).json({ message: "list of theaters recieved successfully", theaters })
        }
    } catch (error) {
        return res.status(500).json({ message: "Error in fetching list of theaters", error: error.message })
    }


}
const addTheater = async (req, res) => {
    const { theater_id, name, location, address, popular, layout_type, films_showing, contact, seating_layout } = req.body;

    if (!theater_id || !name || !location || !address || !layout_type || popular === undefined || !films_showing || !contact) {
        return res.status(400).json({ message: "Fill all the required fields!" });
    }

    if (!seating_layout || seating_layout.length === 0 || seating_layout[0].length === 0) {
        return res.status(400).json({ message: "Invalid seating layout." });
    }


    try {
        const existingTheater = await theater.findOne({ theater_id });
        
        if (existingTheater) {
            return res.status(400).json({ message: "Theater ID must be unique. A theater with this ID already exists." });
        }
        const seating_capacity = seating_layout.length * seating_layout[0].length;

        const newTheater = new theater({
            theater_id,
            name,
            location,
            address,
            layout_type,
            popular,
            seating_capacity,
            seating_layout,
            films_showing,
            contact,
        });

        await newTheater.save();
        res.status(201).json({ success: true, message: "Theater created successfully", theater: newTheater });
    } catch (error) {
        return res.status(500).json({ message: "Error in creating new theater", error: error.message });
    }
};


module.exports = { getTheater, addTheater }