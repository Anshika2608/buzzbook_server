const movie = require("../Models/movieModel")
const Theater = require("../Models/theaterModel")
const cloudinary = require("../Middleware/Cloudinary");
const { getIO } = require("../socket");
const fetchStats = require("../statsHelper");
const getMovie = async (req, res) => {
    try {
        const listOfMovies = await movie.find({});
        return res.status(201).json({ message: "list of movies recieved successfully", listOfMovies })
    } catch (error) {
        return res.status(500).json({ message: "error while getting list of movies", error: error.message })
    }

}
const addMovie = async (req, res) => {
    const { title, language, description, Type, release_date, genre, adult, duration, rating, production_house, director, cast, trailer } = req.body;
    const poster_img = req.files && req.files['poster_img'] ? req.files['poster_img'] : [];

    if (
        title === undefined || language === undefined || description === undefined || Type === undefined || release_date === undefined ||
        genre === undefined || adult === undefined || duration === undefined || rating === undefined || production_house === undefined ||
        director === undefined || cast === undefined
    ) {
        return res.status(401).json({ message: "Fill all the required fields!" });
    }

    try {
        const existingMovie = await movie.findOne({
            title: title.trim(),
            release_date: new Date(release_date),
        });

        if (existingMovie) {
            return res.status(400).json({ message: "Movie already exists in database!" });
        }
        const posterImageUrls = [];
        for (const file of poster_img) {
            try {
                console.log("Uploading to Cloudinary:", file.path);
                const upload = await cloudinary.uploader.upload(file.path);
                posterImageUrls.push(upload.secure_url);
            } catch (error) {
                console.error("Error while uploading the poster image:", error);
                return res.status(400).json({ message: "Error while uploading the poster image", error: error.message });
            }
        }


        const durationRegex = /^[0-9]$/;


        const parsedDuration = Number(duration);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            return res.status(400).json({ message: "Duration must be a positive number" });
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(release_date)) {
            return res.status(400).json({ message: "Release date must be in format YYYY-MM-DD" });
        }
        const parsedDate = new Date(release_date);
        const isAdult = adult === 'true' || adult === true;
        const genreArray = Array.isArray(genre) ? genre : genre.split(',').map(g => g.trim());
        const castArray = Array.isArray(cast) ? cast : cast.split(',').map(c => c.trim());
        const trailerArray = trailer ? (Array.isArray(trailer) ? trailer : trailer.split(',').map(t => t.trim())) : [];
        const Movie = new movie({
            title,
            language,
            description,
            Type,
            release_date: parsedDate,
            genre: genreArray,
            adult: isAdult,
            duration: parsedDuration,
            rating,
            production_house,
            director,
            cast: castArray,
            poster_img: posterImageUrls,
            trailer: trailerArray
        });
        const newMovie = await Movie.save();
        const updatedStats = await fetchStats();
        const io = getIO();
        io.emit("statsUpdated", updatedStats);
        return res.status(201).json({ message: "movie added successfully", movie: newMovie })

    } catch (error) {
        return res.status(500).json({ message: "error while adding a new movie", error: error.message })
    }

}
const getMovieFromLocation = async (req, res) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ message: "Fill all the required fields" });
    }

    try {
        console.log("Searching for location:", location);

        const theaters = await Theater.find({ "location.city": { $regex: new RegExp("^" + location, "i") } });
        console.log("Matched theaters:", theaters);

        if (theaters.length === 0) {
            return res.status(404).json({ message: "No theaters found in this location" });
        }
        const filmTitles = new Set();
        theaters.forEach(theater => {
            theater.audis.forEach(audi => {
                audi.films_showing.forEach(film => {
                    filmTitles.add(film.title);
                });
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
const getMovieDetails = async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) {
            return res.status(400).json({ message: "Movie title is required" });
        }

        const movieData = await movie.findOne({
            title: { $regex: new RegExp("^" + title + "$", "i") }
        });

        if (!movieData) {
            return res.status(404).json({ message: "Movie not found" });
        }

        res.status(200).json({ success: true, movie: movieData });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving movie details", error: error.message });
    }
};
module.exports = { getMovie, addMovie, getMovieFromLocation, getMovieDetails }