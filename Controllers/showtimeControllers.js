const mongoose = require("mongoose");
const Theater = require("../Models/theaterModel");

const updateShowtime = async (req, res) => {
  const { theater_id, movie_title, showtime_id, new_time } = req.body;
  if (!theater_id || !movie_title || !showtime_id || !new_time) {
    return res.status(400).json({ message: "Fill all the required fields!" });
  }
  try {
    const theaterData = await Theater.findOne({ theater_id });
    if (!theaterData) {
      return res.status(404).json({ message: "Theater not found!" });
    }
    if (!theaterData.films_showing || !Array.isArray(theaterData.films_showing)) {
      return res.status(500).json({ message: "Invalid theater data. No films found." });
    }
    const movie = theaterData.films_showing.find(film => film.title === movie_title);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found!" });
    }
    if (!movie.showtimes || !Array.isArray(movie.showtimes)) {
      return res.status(500).json({ message: "Invalid movie data. No showtimes found." });
    }
    const showtime = movie.showtimes.find(show => show._id.toString() === showtime_id);
    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found!" });
    }
    showtime.time = new_time;
    await theaterData.save();
    return res.status(200).json({
      message: "Showtime updated successfully!",
      updatedShowtime: showtime
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating the showtime", error: error.message });
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

const deleteShowtime=async(req,res)=>{
const {theater_id,movie_title,showtime}=req.body;
if(!theater_id || !movie_title || !showtime ){
    return res.status(400).json({message:"fill all the required fields"})
}
try{
  const theaterData=await Theater.findOne({theater_id})
  if(!theaterData){
    return res.status(404).json({message:"Theater not found!"})
  }
  const movie = theaterData.films_showing.find(
    film => film.title.toLowerCase().trim() === movie_title.toLowerCase().trim()
);

if (!movie) {
    return res.status(404).json({ message: "Movie not found in this theater!" });
}

const showtimeIndex = movie.showtimes.findIndex(
    show => show.time.toLowerCase().trim() === showtime.toLowerCase().trim()
);

if (showtimeIndex === -1) {
    return res.status(404).json({ message: "Showtime not found!" });
}

movie.showtimes.splice(showtimeIndex, 1);
await theaterData.save();

return res.status(200).json({ message: "Showtime deleted successfully!" });

}catch(error){
    return res.status(500).json({message:"Error deleting the showtime!"})
}

}
module.exports = { updateShowtime ,addShowtime,getShowtime,deleteShowtime};
