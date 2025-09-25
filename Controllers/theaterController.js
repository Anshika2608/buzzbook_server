const theater = require("../Models/theaterModel");
const { getIO } = require("../socket")
const fetchStats = require("../statsHelper")
const mongoose = require("mongoose");
const Booking=require("../Models/BookingModel")
const TempBooking=require("../Models/TempBookingModel")
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
    const { theater_id, name, location, address, popular, contact, audis, cancellationAvailable,facilities } = req.body;

    if (!theater_id || !name || !location || !address || !popular === undefined || !contact || !Array.isArray(audis) || audis.length === 0 ||
      !Array.isArray(facilities) ||
      facilities.length === 0) {
      return res.status(400).json({ message: "Fill all the required fields including audis!" });
    }

    const existingTheater = await theater.findOne({ theater_id });
    if (existingTheater) {
      return res.status(400).json({ message: "Theater with this ID already exists." });
    }

    const formattedAudis = audis.map(audi => {
      const {
        audi_number,
        layout_type,
        rows,
        seatsPerRow,
        vipRows = 0,
        premiumRows = 0,
        sofaRows = 0,
        regularRows = 0,
        reclinerRows = 0,
        emptySpaces = [],
        films_showing
      } = audi;

      if (!audi_number || !layout_type || !rows || !seatsPerRow || !Array.isArray(films_showing) || films_showing.length === 0) {
        throw new Error(`Invalid data for audi: ${audi_number}`);
      }

      const seating_capacity = rows * seatsPerRow;

      const formattedFilms = films_showing.map(film => ({
        title: film.title,
        language: film.language,
        showtimes: film.showtimes.map(show => ({
          time: show.time,
          prices: show.prices,
          seating_layout:show.seating_layout
        }))
      }));


      return {
        audi_number,
        layout_type,
        rows,
        seatsPerRow,
        seating_capacity,
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
      audis: formattedAudis,
      facilities,
      cancellationAvailable: Boolean(cancellationAvailable)
    });

    await newTheater.save();
    const io = getIO();
    io.emit("statsUpdated", { type: "theater", data: newTheater });
    res.status(201).json({ success: true, message: "Theater with audis created successfully", theater: newTheater });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in creating theater", error: error.message });
  }
};

const getSeatLayout = async (req, res) => {
  const { theater_id, movie_title, showtime, show_date } = req.query;

  if (!theater_id || !movie_title || !showtime) {
    return res.status(400).json({ message: "Theater ID, movie title, and showtime are required" });
  }

  try {
    const theaters = await theater.findOne({ _id:theater_id });
    if (!theaters) return res.status(404).json({ message: "Theater not found" });

    const date = show_date ? new Date(show_date) : new Date();
    const formattedDate = date.toISOString().split("T")[0];

    const audi = theaters.audis.find(audi =>
      audi.films_showing.some(film =>
        film.title.toLowerCase() === movie_title.toLowerCase() &&
        film.showtimes.some(s => s.time === showtime)
      )
    );

    if (!audi) return res.status(404).json({ message: "Movie not found in any audi at this showtime" });

    // Find the specific film and showtime
    const film = audi.films_showing.find(f => f.title.toLowerCase() === movie_title.toLowerCase());
    const show = film.showtimes.find(s => s.time === showtime);

    // Clone template layout
    const dynamicLayout = JSON.parse(JSON.stringify(show.seating_layout));

    const now = new Date();

    // Mark booked seats for this date
    const bookedSeats = await Booking.find({
      theater_id,
      audi_number: audi.audi_number,
      movie_title,
      showtime,
      show_date: formattedDate
    }).select("seats -_id");
    const bookedFlat = bookedSeats.flatMap(b => b.seats);

    const heldSeats = await TempBooking.find({
      theater_id,
      audi_number: audi.audi_number,
      movie_title,
      showtime,
      show_date: formattedDate,
      hold_expires_at: { $gt: now }
    }).select("seats -_id");
    const heldFlat = heldSeats.flatMap(h => h.seats);

   
    for (let row of dynamicLayout) {
      for (let seat of row) {
        if (bookedFlat.includes(seat.seat_number)) seat.is_booked = true;
        if (heldFlat.includes(seat.seat_number)) seat.is_held = true;
      }
    }

    return res.status(200).json({
      message: "Seat layout fetched successfully",
      seating_layout: dynamicLayout,
      audi_number: audi.audi_number, 
      show_date: formattedDate
    });

  } catch (error) {
    console.error("Error fetching seat layout:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
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

    const theaterData = await theater.find({
      "location.city": { $regex: location, $options: "i" },
      audis: {
        $elemMatch: {
          films_showing: {
            $elemMatch: {
              title: { $regex: title, $options: "i" }
            }
          }
        }
      }
    });

    if (!theaterData || theaterData.length === 0) {
      return res.status(404).json({ message: "This movie is not available at any theater in this location" });
    }

    return res.status(200).json({ message: "Theaters shown successfully", theaterData });
  } catch (error) {
    return res.status(500).json({
      message: "Error while getting theaters for particular film",
      error: error.message
    });
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
    const theaterData = await theater.findById(theater_id)

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
const addFilmToAudi = async (req, res) => {
  const { theater_id, audi_number, title, language, showtimes } = req.body;

  if (!theater_id || !audi_number || !title || !language || !Array.isArray(showtimes) || showtimes.length === 0) {
    return res.status(400).json({ message: "All fields including an array of showtimes are required." });
  }

  try {
    const theaterData = await theater.findOne({ theater_id });
    if (!theaterData) {
      return res.status(404).json({ message: "Theater not found." });
    }

    const audi = theaterData.audis.find(a => a.audi_number === audi_number);
    if (!audi) {
      return res.status(404).json({ message: "Audi not found in the theater." });
    }

    // Check layout type and required seat types
    const layoutType = audi.layout_type.toLowerCase();
    const layoutSeatMap = {
      standard: ["VIP", "Premium", "Regular"],
      luxury: ["Sofa", "Regular"],
      studio: ["Regular"],
      recliner: ["Recliner", "Regular"],
      balcony: ["Premium", "Regular"]
    };

    const requiredSeatTypes = layoutSeatMap[layoutType];
    if (!requiredSeatTypes) {
      return res.status(400).json({ message: `Invalid layout type: ${layoutType}` });
    }

    // Validate each showtime object
    for (const show of showtimes) {
      if (!show.time || !show.prices || typeof show.prices !== "object") {
        return res.status(400).json({ message: "Each showtime must include time and prices." });
      }

      for (const seatType of requiredSeatTypes) {
        if (!(seatType in show.prices)) {
          return res.status(400).json({ message: `Price for '${seatType}' is missing in showtime: ${show.time}` });
        }
      }
    }

    // Check if film already exists
    const filmExists = audi.films_showing.some(f => f.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (filmExists) {
      return res.status(400).json({ message: "This film already exists in the audi." });
    }

    // Add new film with showtimes
    audi.films_showing.push({
      title,
      language,
      showtimes: showtimes.map(show => ({
        time: show.time,
        audi_number,
        prices: show.prices
      }))
    });

    await theaterData.save();
    res.status(201).json({ message: "Film with showtimes added successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add film", error: error.message });
  }
};
const getTheaterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid Theater ID" });
    }

    const Theater = await theater.findById(id).populate("audis.films_showing");

    if (!Theater) {
      return res.status(404).json({ message: "Theater not found" });
    }

    res.json(Theater);
  } catch (error) {
    console.error("Error in getTheaterById:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
const getPriceRangesForMovie = async (req, res) => {
  try {
    const { movie, city } = req.query;

    if (!movie || !city) {
      return res.status(400).json({ message: "Both movie and city are required" });
    }
    const theaters = await theater.find({
      "location.city": { $regex: new RegExp(`^${city}$`, "i") },
      "audis.films_showing.title": { $regex: new RegExp(`^${movie}$`, "i") }
    }).lean();
    if (!theaters.length) {
      return res.status(404).json({
        success: false,
        message: `No theaters found showing "${movie}" in "${city}".`
      });
    }
    let prices = [];

    theaters.forEach(theater => {
      theater.audis.forEach(audi => {
        audi.films_showing.forEach(film => {
          if (film.title.toLowerCase() === movie.toLowerCase()) {
            film.showtimes.forEach(show => {
              prices.push(...Object.values(show.prices));
            });
          }
        });
      });
    });

    const uniquePrices = [...new Set(prices.filter(p => p > 0))].sort((a, b) => a - b);

    const predefinedRanges = [
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
    ];

    const availableRanges = predefinedRanges.filter(range =>
      uniquePrices.some(price => price >= range.min && price <= range.max)
    ).map(range => `${range.min}-${range.max}`);

    res.status(200).json({
      success: true,
      movie,
      availablePriceRanges: availableRanges
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching price ranges", error: error.message });
  }
};
const filterTheatersByMovieCityAndPrice = async (req, res) => {
  try {
    const { movie, city, priceRange } = req.query;

    if (!movie || !city || !priceRange) {
      return res.status(400).json({ message: "Movie, city, and priceRange are required" });
    }

    const [minPrice, maxPrice] = priceRange.split("-").map(Number);

    const theaters = await theater.find({
      "location.city": { $regex: new RegExp(`^${city}$`, "i") },
      "audis.films_showing.title": { $regex: new RegExp(`^${movie}$`, "i") }
    }).lean();

    if (!theaters.length) {
      return res.status(404).json({
        success: false,
        message: `No theaters found showing "${movie}" in "${city}".`
      });
    }
    const filteredTheaters = theaters.map(theater => {
      const matchedAudis = theater.audis.map(audi => {
        const matchedFilms = audi.films_showing.map(film => {
          if (film.title.toLowerCase() === movie.toLowerCase()) {
            const matchedShowtimes = film.showtimes.filter(show => {
              return Object.values(show.prices).some(
                price => price >= minPrice && price <= maxPrice
              );
            });

            return matchedShowtimes.length > 0
              ? { ...film, showtimes: matchedShowtimes }
              : null;
          }
          return null;
        }).filter(film => film !== null);

        return matchedFilms.length > 0
          ? { ...audi, films_showing: matchedFilms }
          : null;
      }).filter(audi => audi !== null);

      return matchedAudis.length > 0
        ? { ...theater, audis: matchedAudis }
        : null;
    }).filter(theater => theater !== null);

    if (filteredTheaters.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No showtimes found in the price range ${priceRange} for "${movie}" in "${city}".`
      });
    }

    res.status(200).json({
      success: true,
      count: filteredTheaters.length,
      theaters: filteredTheaters
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error filtering theaters", error: error.message });
  }
};
const getUniqueLanguagesInCity = async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) {
      return res.status(400).json({ success: false, message: "City is required" });
    }

    const theaters = await theater.find({"location.city": { $regex: new RegExp(`^${city}$`, "i") }});

    if (!theaters.length) {
      return res.status(404).json({ success: false, message: "No theaters found in this city" });
    }

    const allLanguages = theaters.flatMap(theater =>
      theater.audis.flatMap(audi =>
        audi.films_showing.map(film => film.language.toLowerCase()) 
      )
    );

    const uniqueLanguages = [...new Set(allLanguages)];

    return res.status(200).json({
      success: true,
      message: `Unique languages in theaters for ${city} fetched successfully`,
      languages: uniqueLanguages
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching unique languages",
      error: error.message
    });
  }
};

module.exports = {
  deleteTheater, getTheater, addTheater, getSeatLayout, getTheaterForMovie, bookSeat, addAudi, addFilmToAudi, getTheaterById,
  getPriceRangesForMovie, filterTheatersByMovieCityAndPrice, getUniqueLanguagesInCity
}