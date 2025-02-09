const theater = require("../Models/theaterModel");
const getTheater = async (req, res) => {
    try {
        const { location } = req.query;
        const theaters = await theater.find({ location: { $regex: new RegExp("^" + location, "i") } })
        if (!theaters.length) {
            return res.status(400).json({ message: `No theater available in ${location}` })
        }
        else {
            return res.status(201).json({ message: "list of theaters recieved successfully", theaters })
        }
    } catch (error) {
        return res.status(500).json({ message: "Error in fetching list of theaters", error: error.message })
    }


}


const addTheater = async (req, res) => {
    try {
        let {
            theater_id, name, location, address, popular, layout_type, films_showing, contact,
            seating_layout, rows, seatsPerRow, premiumRows, vipRows, regularRows, reclinerRows, sofaRows, emptySpaces
        } = req.body;

        // Convert rows & seatsPerRow to numbers to avoid type issues
        rows = rows ? Number(rows) : null;
        seatsPerRow = seatsPerRow ? Number(seatsPerRow) : null;

        // Validate required fields
        if (!theater_id || !name || !location || !address || !layout_type || popular === undefined || !films_showing || !contact || !rows || !seatsPerRow) {
            return res.status(400).json({ message: "Fill all the required fields!", received: { rows, seatsPerRow } });
        }

        // Validate `seating_layout`
        if (!seating_layout || !Array.isArray(seating_layout) || seating_layout.length === 0) {
            return res.status(400).json({ message: "Invalid seating layout. It must be a non-empty array." });
        }

        // Check if theater already exists (by `theater_id` or `name + address`)
        const existingTheater = await theater.findOne({ theater_id });
        const existingTheaterName = await theater.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
            address: { $regex: new RegExp(`^${address}$`, "i") }
        });

        if (existingTheater) {
            return res.status(400).json({ message: "Theater ID must be unique. A theater with this ID already exists." });
        }
        if (existingTheaterName) {
            return res.status(400).json({ message: "Theater with this name already exists in this location!" });
        }

        // Calculate seating capacity correctly
        const seating_capacity = rows * seatsPerRow;

        // Format Films with Showtimes
        const formattedFilms = films_showing.map(film => ({
            title: film.title,
            language: film.language,
            showtimes: film.showtimes.map(time => ({
                time,
                seating_layout  // Ensure this matches schema
            }))
        }));

        // Create a new Theater document
        const newTheater = new theater({
            theater_id,
            name,
            location,
            address,
            layout_type,
            popular,
            seating_capacity,
            seating_layout,
            films_showing: formattedFilms,
            contact,
            rows,
            seatsPerRow,
            premiumRows,
            vipRows,
            regularRows,
            reclinerRows,
            sofaRows,
            emptySpaces
        });

        await newTheater.save();
        res.status(201).json({ success: true, message: "Theater created successfully", theater: newTheater });
    } catch (error) {
        return res.status(500).json({ message: "Error in creating new theater", error: error.message });
    }
};





const getSeatLayout = async (req, res) => {
    const { name } = req.params;
    try {
        const theaterData = await theater.findOne({
            name: { $regex: new RegExp(`^${name}`, "i") }
        });
        if (!theaterData) {
            return res.status(400).json({ message: "Theater not found " })
        }
        else {
            return res.status(201).json({ message: "Seat layout fetched successfully", layout: theaterData.seating_layout })
        }
    } catch (error) {
        return res.status(500).json({ message: "Error in fetching seat_layout", error: error.message })
    }

}
const getTheaterForMovie = async (req, res) => {

    try {
        const { location, title } = req.params;
        if (!title) {
            return res.status(400).json({ message: "provide film for which theater have to be shown" })
        } else if (!location) {
            return res.status(400).json({ message: "Select location first!" })
        } else {
            const theaters = await theater.find({ "films_showing.title": title, location: { $regex: location, $options: "i" } });
            if (!theaters || theaters.length === 0) {
                return res.status(404).json({ message: "this movie is not available at any theater in this location" })
            } else {
                return res.status(201).json({ message: "theaters shown successfully", theaters })
            }

        }
    } catch (error) {
        return res.status(500).json({ message: "Error while getting theaters for particular film", error: error.message });
    }
}
const bookSeat = async (req, res) => {

}
module.exports = { getTheater, addTheater, getSeatLayout, getTheaterForMovie, bookSeat }