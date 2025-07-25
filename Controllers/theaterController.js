const theater = require("../Models/theaterModel");
const getTheater = async (req, res) => {
    try {

        const theaters = await theater.find({})
        if (!theaters.length) {
            return res.status(400).json({ message: "No theater available" })
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
        const { theater_id, name, location, address, popular, contact, audis } = req.body;

        if (!theater_id || !name || !location || !address || !popular === undefined || !contact || !Array.isArray(audis) || audis.length === 0) {
            return res.status(400).json({ message: "Fill all the required fields including audis!" });
        }

        const existingTheater = await theater.findOne({ theater_id });
        if (existingTheater) {
            return res.status(400).json({ message: "Theater with this ID already exists." });
        }

        const formattedAudis = audis.map(audi => {
            const { audi_number, layout_type, rows, seatsPerRow, seating_layout, vipRows, premiumRows, sofaRows, regularRows, reclinerRows, emptySpaces, films_showing } = audi;

            if (!audi_number || !layout_type || !rows || !seatsPerRow || !Array.isArray(seating_layout) || seating_layout.length === 0) {
                throw new Error(`Invalid data for audi: ${audi_number}`);
            }

            const seating_capacity = rows * seatsPerRow;

            const formattedFilms = films_showing.map(film => ({
                title: film.title,
                language: film.language,
                showtimes: film.showtimes.map(show => ({
                    time: show.time,
                    audi_number: show.audi_number,
                    prices: show.prices 
                }))
            }));


            return {
                audi_number,
                layout_type,
                rows,
                seatsPerRow,
                seating_capacity,
                seating_layout,
                vipRows,
                premiumRows,
                sofaRows,
                regularRows,
                reclinerRows,
                emptySpaces,
                films_showing: formattedFilms
            };
        });

        const newTheater = new theater({
            theater_id,
            name,
            location,
            address,
            popular,
            contact,
            audis: formattedAudis
        });

        await newTheater.save();
        res.status(201).json({ success: true, message: "Theater with audis created successfully", theater: newTheater });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error in creating theater", error: error.message });
    }
};

const getSeatLayout = async (req, res) => {
    const { theater_id, movie_title, showtime } = req.query;

    if (!theater_id || !movie_title || !showtime) {
        return res.status(400).json({ message: "Please provide theater_id, movie_title, and showtime." });
    }

    try {
        const theaterData = await theater.findOne({ theater_id });
        if (!theaterData) {
            return res.status(404).json({ message: "Theater not found." });
        }

        let foundLayout = null;

        for (const audi of theaterData.audis) {
            const film = audi.films_showing.find(f =>
                f.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
            );

            if (film) {
                const matchedShow = film.showtimes.find(s =>
                    s.time.trim() === showtime.trim() &&
                    s.audi_number.trim() === audi.audi_number.trim()
                );

                if (matchedShow) {
                    foundLayout = audi.seating_layout;
                    break;
                }
            }
        }

        if (!foundLayout) {
            return res.status(404).json({ message: "Showtime or movie not found in any audi." });
        }

        return res.status(200).json({
            message: "Seat layout fetched successfully.",
            layout: foundLayout
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching seat layout",
            error: error.message
        });
    }
};


const getTheaterForMovie = async (req, res) => {
    try {
        const { location, title } = req.query;

        if (!title) {
            return res.status(400).json({ message: "Provide film for which theater has to be shown" });
        }

        if (!location) {
            return res.status(400).json({ message: "Select location first!" });
        }

        const theaters = await theater.find({
            location: { $regex: location, $options: "i" },
            audis: {
                $elemMatch: {
                    "films_showing.title": title
                }
            }
        });

        if (!theaters || theaters.length === 0) {
            return res.status(404).json({ message: "This movie is not available at any theater in this location" });
        }

        return res.status(200).json({ message: "Theaters shown successfully", theaters });
    } catch (error) {
        return res.status(500).json({ message: "Error while getting theaters for particular film", error: error.message });
    }
};

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
const deleteTheater = async (req, res) => {
    try {
        const { theater_id } = req.params;

        if (!theater_id) {
            return res.status(400).json({ message: "Theater ID is required" });
        }
        const deletedTheater = await theater.findOneAndDelete({ theater_id });

        if (!deletedTheater) {
            return res.status(404).json({ message: "Theater not found" });
        }

        return res.status(200).json({ message: "Theater deleted successfully", deletedTheater });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting theater", error: error.message });
    }
};


const addAudi = async (req, res) => {
  const { theater_id, audis } = req.body;

  if (!theater_id || !Array.isArray(audis) || audis.length === 0) {
    return res.status(400).json({ message: "theater_id and at least one audi must be provided." });
  }

  try {
    const theaterData= await theater.findOne({ theater_id });

    if (!theaterData) {
      return res.status(404).json({ message: "Theater not found." });
    }

    const existingAudiNumbers = theaterData.audis.map(a => a.audi_number);

    for (const newAudi of audis) {
      if (existingAudiNumbers.includes(newAudi.audi_number)) {
        return res.status(400).json({ message: `Audi '${newAudi.audi_number}' already exists in the theater.` });
      }
      theaterData.audis.push(newAudi); 
    }

    await theaterData.save();
    return res.status(201).json({ message: "Audi(s) added successfully." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add audi(s)", error: error.message });
  }
};



module.exports = { deleteTheater, getTheater, addTheater, getSeatLayout, getTheaterForMovie, bookSeat,addAudi }