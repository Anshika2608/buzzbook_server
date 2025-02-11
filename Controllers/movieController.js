const movie = require("../Models/movieModel")
const Theater=require("../Models/theaterModel")
const cloudinary = require("../Middleware/Cloudinary"); 
const getMovie = async (req, res) => {
    try {
        const listOfMovies = await movie.find({});
        return res.status(201).json({ message: "list of movies recieved successfully", listOfMovies })
    } catch (error) {
        return res.status(500).json({ message: "error while getting list of movies", error: error.message })
    }

}
const addMovie = async (req, res) => {
    const { title, language, description, Type, release_date, genre, adult, duration, rating, production_house, director, cast } = req.body;
    const poster_img = req.files && req.files['poster_img'] ? req.files['poster_img'] : [];

    if (
        title === undefined || language === undefined || description === undefined || Type === undefined || release_date === undefined ||
        genre === undefined || adult === undefined || duration === undefined || rating === undefined || production_house === undefined ||
        director === undefined || cast === undefined
    ) {
        return res.status(401).json({ message: "Fill all the required fields!" });
    }

    try {
        const posterImageUrls = [];
        for (const file of poster_img) {
            try {
                console.log("Uploading to Cloudinary:", file.path);
                const upload = await cloudinary.uploader.upload(file.path);
                posterImageUrls.push(upload.secure_url);
            } catch (error) {
                console.error("Error while uploading the bill image:", error);
                return res.status(400).json({ message: "Error while uploading the poster image", error: error.message });
            }
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const durationRegex = /^[0-9]$/;
        const durationNumber = Number(duration);

        if (isNaN(durationNumber) || durationNumber <= 0) {
            return res.status(401).json({ message: "Duration must be a positive number" });
        }

        if (!dateRegex.test(release_date)) {
            return res.status(401).json({ message: "relase date must be in format DD-MM-YYYY!" })
        } else {
            const Movie = new movie({
                title,
                language,
                description,
                Type,
                release_date,
                genre,
                adult,
                duration,
                rating,
                production_house,
                director,
                cast,
                poster_img:posterImageUrls
            })
            const newMovie = await Movie.save();
            return res.status(201).json({ message: "movie added successfully", movie: newMovie })
        }
    } catch (error) {
        return res.status(500).json({ message: "error while adding a new movie", error: error.message })
    }

}
const getMovieFromLocation = async (req, res) => {
    const { location } = req.body;

    if (!location) {
        return res.status(400).json({ message: "Fill all the required fields" });
    }

    try {
        const theaters = await Theater.find({ location: { $regex: new RegExp("^" + location, "i") } });

        if (theaters.length === 0) {
            return res.status(404).json({ message: "No theaters found in this location" });
        }

        const filmTitles = new Set();
        theaters.forEach(theater => {
            theater.films_showing.forEach(film => {
                filmTitles.add(film.title);
            });
        });

        if (filmTitles.size === 0) {
            return res.status(404).json({ message: "No movies found in this location" });
        }

        const movies = await movie.find({ title: { $in: Array.from(filmTitles) } });

        return res.status(200).json({ movies });

    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving the movies based on location",
            error: error.message
        });
    }
};

module.exports = { getMovie, addMovie,getMovieFromLocation }