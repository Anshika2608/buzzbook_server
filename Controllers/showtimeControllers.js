const mongoose = require("mongoose");
const Theater = require("../Models/theaterModel");

const updateShowtime = async (req, res) => {
  const {
    theater_id,
    audi_number,
    movie_title,
    showtime_id,
    new_time,
    new_prices,
    new_audi_number,
    new_movie_title
  } = req.body;

  if (!theater_id || !audi_number || !movie_title || !showtime_id) {
    return res.status(400).json({ message: "Required fields: theater_id, audi_number, movie_title, showtime_id" });
  }

  try {
    const theater = await Theater.findOne({ theater_id });

    if (!theater) {
      return res.status(404).json({ message: "Theater not found!" });
    }

    const sourceAudi = theater.audis.find(a => a.audi_number === audi_number);
    if (!sourceAudi) {
      return res.status(404).json({ message: "Source Audi not found!" });
    }

    const sourceFilm = sourceAudi.films_showing.find(
      f => f.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
    );

    if (!sourceFilm) {
      return res.status(404).json({ message: "Movie not found in source audi!" });
    }

    const showtimeIndex = sourceFilm.showtimes.findIndex(st => st._id.toString() === showtime_id);
    if (showtimeIndex === -1) {
      return res.status(404).json({ message: "Showtime not found!" });
    }

    // Get the showtime object
    const showtimeToUpdate = sourceFilm.showtimes[showtimeIndex];

    // If moving audi or movie, delete from current and re-add to target
    const isMovingAudi = new_audi_number && new_audi_number !== audi_number;
    const isMovingMovie = new_movie_title && new_movie_title.toLowerCase().trim() !== movie_title.toLowerCase().trim();

    if (isMovingAudi || isMovingMovie) {
      // Remove from current film's showtimes
      sourceFilm.showtimes.splice(showtimeIndex, 1);

      const targetAudi = theater.audis.find(a => a.audi_number === (new_audi_number || audi_number));
      if (!targetAudi) {
        return res.status(404).json({ message: "Target Audi not found!" });
      }

      const targetMovieTitle = new_movie_title || movie_title;
      let targetFilm = targetAudi.films_showing.find(
        f => f.title.toLowerCase().trim() === targetMovieTitle.toLowerCase().trim()
      );

      if (!targetFilm) {
        // Add new film entry if it doesn't exist
        targetFilm = {
          title: targetMovieTitle,
          language: sourceFilm.language,
          showtimes: []
        };
        targetAudi.films_showing.push(targetFilm);
      }

      // Add updated showtime to new location
      targetFilm.showtimes.push({
        time: new_time || showtimeToUpdate.time,
        audi_number: new_audi_number || audi_number,
        prices: new_prices || showtimeToUpdate.prices
      });

      await theater.save();
      return res.status(200).json({
        message: "Showtime moved and updated successfully!"
      });
    }

    // If not moving, just update fields in-place
    if (new_time) showtimeToUpdate.time = new_time;
    if (new_audi_number) showtimeToUpdate.audi_number = new_audi_number;
    if (new_prices && typeof new_prices === "object") {
      showtimeToUpdate.prices = {
        ...showtimeToUpdate.prices,
        ...new_prices
      };
    }

    await theater.save();
    return res.status(200).json({
      message: "Showtime updated successfully",
      updatedShowtime: showtimeToUpdate
    });

  } catch (error) {
    console.error("Error updating showtime:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


 

const addShowtime = async (req, res) => {
  const { theater_id, audi_number, movie_title, language, new_showtime, prices } = req.body;

  if (!theater_id || !audi_number || !movie_title || !language || !new_showtime || !prices) {
    return res.status(400).json({ message: "All fields including prices are required." });
  }

  try {
    const theater = await Theater.findOne({ theater_id });

    if (!theater) {
      return res.status(404).json({ message: "Theater not found." });
    }

    const audi = theater.audis.find(a => a.audi_number === audi_number);
    if (!audi) {
      return res.status(404).json({ message: "Audi not found in the theater." });
    }

    // Determine required seat types based on layout_type
    const layoutType = audi.layout_type.toLowerCase();
    const seatTypeMap = {
      standard: ["VIP", "Premium", "Regular"],
      luxury: ["Sofa", "Regular"],
      studio: ["Regular"],
      recliner: ["Recliner", "Regular"],
      balcony: ["Premium", "Regular"]
    };

    const requiredSeatTypes = seatTypeMap[layoutType];
    if (!requiredSeatTypes) {
      return res.status(400).json({ message: `Invalid layout type: ${layoutType}` });
    }

    // Validate that prices for all required seat types are provided
    for (const seatType of requiredSeatTypes) {
      if (!(seatType in prices)) {
        return res.status(400).json({ message: `Price for '${seatType}' is required.` });
      }
    }

    // Find the film or create a new one
    let film = audi.films_showing.find(f => f.title.toLowerCase().trim() === movie_title.toLowerCase().trim());

    if (!film) {
      audi.films_showing.push({
        title: movie_title,
        language: language,
        showtimes: [{
          time: new_showtime,
          audi_number,
          prices
        }]
      });
    } else {
      const alreadyExists = film.showtimes.some(st => st.time === new_showtime);
      if (alreadyExists) {
        return res.status(400).json({ message: "Showtime already exists for this movie." });
      }

      film.showtimes.push({
        time: new_showtime,
        audi_number,
        prices
      });
    }

    await theater.save();
    res.status(200).json({ message: "Showtime added successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add showtime", error: error.message });
  }
};







const getShowtime = async (req, res) => {
  const { theater_id, movie_title } = req.query;

  if (!theater_id || !movie_title) {
    return res.status(400).json({ message: "Fill all the required fields" });
  }

  try {
    const theaterData = await Theater.findOne({ theater_id });

    if (!theaterData) {
      return res.status(404).json({ message: "Theater not found!" });
    }
    let matchedShowtimes = [];
    for (const audi of theaterData.audis) {
      const matchedMovie = audi.films_showing.find(
        film => film.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
      );

      if (matchedMovie) {
        const showtimes = matchedMovie.showtimes.map(show => ({
          time: show.time,
          audi_number: audi.audi_number
        }));
        matchedShowtimes.push(...showtimes);
      }
    }

    if (matchedShowtimes.length === 0) {
      return res.status(404).json({ message: "Movie not found in any audi of this theater" });
    }

    return res.status(200).json({
      message: "Showtimes retrieved successfully",
      showtimes: matchedShowtimes
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error while retrieving the showtimes!",
      error: error.message
    });
  }
};

const deleteShowtime = async (req, res) => {
  const { theater_id, audi_number, movie_title, showtime } = req.body;

  if (!theater_id || !audi_number || !movie_title || !showtime) {
    return res.status(400).json({
      message: "Fields required: theater_id, audi_number, movie_title, showtime"
    });
  }

  try {
    const theater = await Theater.findOne({ theater_id });

    if (!theater) {
      return res.status(404).json({ message: "Theater not found!" });
    }

    const audi = theater.audis.find(a => a.audi_number === audi_number);
    if (!audi) {
      return res.status(404).json({ message: "Audi not found in this theater!" });
    }

    const film = audi.films_showing.find(
      f => f.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
    );

    if (!film) {
      return res.status(404).json({ message: "Movie not found in this audi!" });
    }

    const showIndex = film.showtimes.findIndex(
      s => s.time.toLowerCase().trim() === showtime.toLowerCase().trim()
    );

    if (showIndex === -1) {
      return res.status(404).json({ message: "Showtime not found for this movie!" });
    }

    // Remove the showtime
    film.showtimes.splice(showIndex, 1);

    // If no showtimes left, remove the film entry too
    if (film.showtimes.length === 0) {
      audi.films_showing = audi.films_showing.filter(f => f.title !== film.title);
    }

    await theater.save();
    return res.status(200).json({ message: "Showtime deleted successfully!" });

  } catch (error) {
    console.error("Error deleting showtime:", error);
    return res.status(500).json({ message: "Error deleting the showtime", error: error.message });
  }
};

module.exports = { updateShowtime ,addShowtime,getShowtime,deleteShowtime};
