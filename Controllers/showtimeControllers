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
    const { movie_title, theater_id, showtime } = req.body;


    if (!movie_title || !theater_id || !showtime) {
        return res.status(400).json({ message: "Fill all the required fields" });
    }

    try {
        const theaterData = await Theater.findOne({ theater_id });

        if (!theaterData) {
            return res.status(404).json({ message: "Theater not found" });
        }


        const movie = theaterData.films_showing.find(film => film.title === movie_title);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found in this theater" });
        }


        if (!Array.isArray(movie.showtimes)) {
            movie.showtimes = [];
        }


        const existingShowtime = movie.showtimes.some(s => {
            return s.time.toLowerCase().trim() === showtime.toLowerCase().trim();
        });

        if (existingShowtime) {
            return res.status(409).json({ message: "Showtime already exists for this movie" });
        }


        const newShowtime = {
            _id: new mongoose.Types.ObjectId(),
            time: showtime.trim(),
            seating_layout: req.body.seating_layout || []
        };

        movie.showtimes.push(newShowtime);
        await theaterData.save();


        return res.status(201).json({ 
            message: "Showtime added successfully!", 
            showtime: newShowtime 
        });

    } catch (error) {
        return res.status(500).json({ message: "Error adding the showtime", error: error.message });
    }
};



const getShowtime=async(req,res)=>{
    const{theater_id,movie_title}=req.body;
    if(!theater_id || !movie_title){
        return res.status(400).json({message:"Fill all the required fields"})
    }
    try{
      const theaterData=await Theater.findOne({theater_id})
      if(!theaterData){
        return res.status(404).json({message:"theater not found!"})
      }
      const movie=theaterData.films_showing.find(film => film.title.toLowerCase().trim() === movie_title.toLowerCase().trim())
      if(!movie){
        return res.status(404).json({message:"movie not found"})
      }
      const showtimeTimes=movie.showtimes.map(show=>show.time)
      return res.status(201).json({message:"showtimes recieved successfully",showtimes:showtimeTimes})
    }catch(error){
        return res.status(500).json({message:"Error while recieving the showtimes!",error:error.message})
    }
}
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
