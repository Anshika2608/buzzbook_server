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

        rows = rows ? Number(rows) : null;
        seatsPerRow = seatsPerRow ? Number(seatsPerRow) : null;

        if (!theater_id || !name || !location || !address || !layout_type || popular === undefined || !films_showing || !contact || !rows || !seatsPerRow) {
            return res.status(400).json({ message: "Fill all the required fields!", received: { rows, seatsPerRow } });
        }

        if (!seating_layout || !Array.isArray(seating_layout) || seating_layout.length === 0) {
            return res.status(400).json({ message: "Invalid seating layout. It must be a non-empty array." });
        }
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

        const seating_capacity = rows * seatsPerRow;

        const formattedFilms = films_showing.map(film => ({
            title: film.title,
            language: film.language,
            showtimes: film.showtimes.map(time => ({
                time,
                seating_layout  
            }))
        }));

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
    const { name, movie_title, showtime } = req.params;
    try {
        const theaterData = await theater.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") }, 
        });
        if (!theaterData) {
            return res.status(404).json({ message: "Theater not found." });
        }
        const movie = theaterData.films_showing.find(film => film.title === movie_title);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found in this theater." });
        }

        const show = movie.showtimes.find(st => st.time === showtime);
        if (!show) {
            return res.status(404).json({ message: "Showtime not found for this movie." });
        }

        return res.status(200).json({
            message: "Seat layout fetched successfully.",
            layout: show.seating_layout
        });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching seat layout", error: error.message });
    }
};
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
    try {
        const { theater_id, movie_title, showtime, seat_number } = req.body;

        if (!theater_id || !movie_title || !showtime || !seat_number) {
            return res.status(400).json({ message: "All fields are required: theater_id, movie_title, showtime, seat_number." });
        }

        
        let theaters = await theater.findOne({ theater_id });
        if (!theaters) {
            return res.status(404).json({ message: "Theater not found." });
        }
        const movie = theaters.films_showing.find(film => film.title === movie_title);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found in this theater." });
        }
        const show = movie.showtimes.find(st => st.time === showtime);
        if (!show) {
            return res.status(404).json({ message: "Showtime not found for this movie." });
        }
        let seatFound = false;
        show.seating_layout.forEach(row => {
            row.forEach(seat => {
                if (seat.seat_number === seat_number) {
                    if (seat.is_booked) {
                        return res.status(400).json({ message: "Seat is already booked." });
                    }
                    seat.is_booked = true;  
                    seatFound = true;
                }
            });
        });
        if (!seatFound) {
            return res.status(404).json({ message: "Seat not found." });
        }
        await theaters.save();
        res.status(200).json({ success: true, message: "Seat booked successfully", theaters });
    } catch (error) {
        return res.status(500).json({ message: "Error booking the seat", error: error.message });
    }
};
const deleteTheater=async(req,res)=>{

}
module.exports = {deleteTheater, getTheater, addTheater, getSeatLayout, getTheaterForMovie, bookSeat }