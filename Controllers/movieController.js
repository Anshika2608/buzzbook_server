const movie = require("../Models/movieModel")
const Theater = require("../Models/theaterModel")
const cloudinary = require("../Middleware/Cloudinary");
const { getIO } = require("../socket");
const fetchStats = require("../statsHelper");
 const client = require("../config/redisClient"); 

const getMovie = async (req, res) => {
    try {
        const listOfMovies = await movie.find({});
        return res.status(201).json({ message: "list of movies recieved successfully", listOfMovies })
    } catch (error) {
        return res.status(500).json({ message: "error while getting list of movies", error: error.message })
    }

}

const addMovie = async (req, res) => {
    try {
        const {
            title,
            language,
            description,
            Type,
            industry,
            release_date,
            reviews,
            genre,
            adult,
            duration,
            rating,
            production_house,
            director,
            cast,
            trailer,
            certification,
            status,
            expiry_date
        } = req.body;

        if (
            !title || !language || !description || !Type || !industry || !release_date ||
            !genre || adult === undefined || !duration || !rating ||
            !production_house || !director || !cast || !expiry_date
        ) {
            return res.status(400).json({ message: "Fill all the required fields!" });
        }

        const existingMovie = await movie.findOne({
            title: title.trim(),
            release_date: new Date(release_date)
        });

        if (existingMovie) {
            return res.status(400).json({ message: "Movie already exists in database!" });
        }

        const posterFiles = req.files?.poster_img || [];
        const posterImageUrls = [];
        for (const file of posterFiles) {
            const upload = await cloudinary.uploader.upload(file.path);
            posterImageUrls.push(upload.secure_url);
        }

        const castFiles = req.files?.cast_img || [];
        let castArrayParsed = typeof cast === 'string' ? JSON.parse(cast) : cast;

        if (castArrayParsed.length > 6) {
            return res.status(400).json({ message: "Maximum 6 cast members allowed." });
        }

        if (castArrayParsed.length !== castFiles.length) {
            return res.status(400).json({ message: "Number of cast images must match number of cast members." });
        }

        const castWithPhotos = castArrayParsed.map((c, idx) => ({
            name: c.name,
            role: c.role,
            photo: castFiles[idx] ? cloudinary.uploader.upload(castFiles[idx].path).then(u => u.secure_url) : ""
        }));

        const finalCast = await Promise.all(
            castWithPhotos.map(async c => {
                if (c.photo && typeof c.photo.then === "function") {
                    const url = await c.photo;
                    return { ...c, photo: url };
                }
                return c;
            })
        );

        const languageArray = Array.isArray(language) ? language : language.split(',').map(l => l.trim());
        const genreArray = Array.isArray(genre) ? genre : genre.split(',').map(g => g.trim());
        const trailerArray = trailer ? (Array.isArray(trailer) ? trailer : JSON.parse(trailer)) : [];
        const reviewsArray = reviews ? (Array.isArray(reviews) ? reviews : JSON.parse(reviews)) : [];
        const parsedDuration = Number(duration);
        if (isNaN(parsedDuration) || parsedDuration <= 0) {
            return res.status(400).json({ message: "Duration must be a positive number" });
        }

        const parsedDate = new Date(release_date);
        const parsedExpiryDate = new Date(expiry_date)
        if (isNaN(parsedReleaseDate) || isNaN(parsedExpiryDate)) {
            return res.status(400).json({ success: false, message: "Invalid date format" });
        }

        const isAdult = adult === 'true' || adult === true;

        const newMovie = new movie({
            title,
            language: languageArray,
            description,
            Type,
            industry,
            expiry_date: parsedExpiryDate,
            release_date: parsedDate,
            genre: genreArray,
            adult: isAdult,
            duration: parsedDuration,
            rating,
            production_house,
            director,
            cast: finalCast,
            poster_img: posterImageUrls,
            trailer: trailerArray,
            certification: certification || "",
            status: status || "upcoming",
            reviews: reviewsArray
        });

        const savedMovie = await newMovie.save();

        const updatedStats = await fetchStats();
        const io = getIO();
        io.emit("statsUpdated", updatedStats);
        io.emit("movieAdded", savedMovie);

        return res.status(201).json({ message: "Movie added successfully", movie: savedMovie });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while adding a new movie", error: error.message });
    }
};


const getMovieFromLocation = async (req, res) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ message: "Fill all the required fields" });
    }

    try {
            const theaters = await Theater.find(
            { "location.city": { $regex: `^${location.trim()}$`, $options: "i" }  },
            { "audis.films_showing.title": 1 }
        );

        if (!theaters.length) {
            return res.status(404).json({ message: "No theaters found in this location" });
        }

        const filmTitlesSet = new Set();
        theaters.forEach(theater =>
            theater.audis.forEach(audi =>
                audi.films_showing.forEach(film => filmTitlesSet.add(film.title))
            )
        );
        const filmTitles = Array.from(filmTitlesSet);

        if (!filmTitles.length) {
            return res.status(404).json({ message: "No movies found in this location" });
        }

        const moviesFromDB = await movie.find(
            { title: { $in: filmTitles } },
            { poster_img: 1, title: 1, genre: 1, language: 1, _id: 0 } 
        );


        // 6️⃣ Return response
        return res.status(200).json({
            movies: moviesFromDB,
            source: "db"
        });

    } catch (error) {
        console.error("Error fetching movies:", error);
        return res.status(500).json({
            message: "Error retrieving the movies based on location",
            error: error.message
        });
    }
};



const getMovieDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Movie ID is required" });
        }

        const movieData = await movie.findById(id);

        if (!movieData) {
            return res.status(404).json({ message: "Movie not found" });
        }

        res.status(200).json({ success: true, movie: movieData });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error retrieving movie details", error: error.message });
    }
};
const deleteMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        if (!movieId) {
            return res.status(400).json({ message: "movieId is required!" })
        }
        const movieToDelete = await movie.findById(movieId);
        if (!movieToDelete) {
            return res.status(400).json({ message: "movie not found!" })
        }
        if (movieToDelete.poster && movieToDelete.poster.public_id) {
            await cloudinary.uploader.destroy(movieToDelete.poster.public_id);
        }
        await movie.findByIdAndDelete(movieId);
        const stats = await fetchStats();
        const io = getIO();
        io.emit("movieDeleted", movieId);
        io.emit("statsUpdated", stats);
        return res.status(200).json({ message: "movie deleted successfully!", movieId, stats })
    } catch (err) {
        return res.status(500).json({ message: "Error in deleting movie", error: err.message })
    }
}
const comingSoon = async (req, res) => {

    try {
        const movies = await movie.find({ status: "upcoming" })
        return res.status(200).json({ message: "coming Soon movies fetched successfully", movies })
    } catch (error) {
        return res.json({ message: "error in showing coming soon movies", error: Error.message })
    }
}
const getUniqueGenres = async (req, res) => {
    try {
        const { city } = req.body;
        if (!city) {
            return res.status(400).json({
                success: false,
                message: "Provide the name of city",
            })
        }
        const theaters = await Theater.find({ "location.city": { $regex: new RegExp(`^${city}$`, "i") } })
        if (!theaters || !theaters.length > 0) {
            return res.status(400).json({ status: false, message: "Theaters are not present in this location" })
        }
        const movieTitlesSet = new Set();
        theaters.forEach(theater => {
            theater.audis.forEach(audi => {
                audi.films_showing.forEach(film => {
                    movieTitlesSet.add(film.title)
                })
            })
        })
        const movieTitles = Array.from(movieTitlesSet);
        if (!movieTitles.length) {
            return res.status(404).json({
                success: false,
                message: "No movies are showing in the theaters of this city"
            });
        }
        const movies = await movie.find({ title: { $in: movieTitles } })
        const uniqueGenreSet = new Set();
        movies.forEach(movie => {
            movie.genre.forEach(genre => uniqueGenreSet.add(genre.toLowerCase()));
        })
        const uniqueGenre = Array.from(uniqueGenreSet)
        return res.status(200).json({
            success: true,
            message: "Unique genres fetched successfully",
            uniqueGenre
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in fetching unique genres",
            error: error.message
        });
    }
}
const getMoviesByGenre = async (req, res) => {
    try {
        const { genre, city } = req.body;

        if (!genre || !city) {
            return res.status(400).json({
                success: false,
                message: "Provide city and genre both"
            });
        }
        const theaters = await Theater.find({
            "location.city": { $regex: new RegExp(`^${city}$`, "i") }
        });

        if (!theaters.length) {
            return res.status(404).json({
                success: false,
                message: `No theaters are present in ${city}`
            });
        }
        const movieTitlesSet = new Set();
        theaters.forEach(theater => {
            theater.audis.forEach(audi => {
                audi.films_showing.forEach(film => {
                    movieTitlesSet.add(film.title);
                });
            });
        });

        const movieTitles = Array.from(movieTitlesSet);

        if (!movieTitles.length) {
            return res.status(404).json({
                success: false,
                message: "No movies are showing in the theaters of this city"
            });
        }

        const genreArray = Array.isArray(genre) ? genre : [genre];
        const genreRegexArray = genreArray.map(g => new RegExp(`^${g}$`, "i"));

        const movies = await movie.find({
            title: { $in: movieTitles },
            genre: { $in: genreRegexArray }
        });

        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: `No movies found for genre(s): ${genreArray.join(", ")} in ${city}`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Movies fetched successfully",
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in fetching movies by genre",
            error: error.message
        });
    }
};


const getMovieByLanguage = async (req, res) => {
    try {
        const { city, language } = req.body;

        if (!city) {
            return res.status(400).json({ success: false, message: "City is required" });
        }

        const theaters = await Theater.find({ "location.city": { $regex: new RegExp(`^${city}$`, "i") } });

        if (!theaters.length) {
            return res.status(404).json({ success: false, message: "No theaters found in this city" });
        }

        const languageArray = Array.isArray(language) ? language : [language];
        const languageRegexArray = languageArray.map(l => new RegExp(`^${l}$`, "i"));

        const movieTitlesSet = new Set();

        theaters.forEach(theater => {
            theater.audis.forEach(audi => {
                audi.films_showing.forEach(film => {
                    if (languageRegexArray.some(regex => regex.test(film.language))) {
                        movieTitlesSet.add(film.title);
                    }
                });
            });
        });

        const movieTitles = Array.from(movieTitlesSet);

        if (!movieTitles.length) {
            return res.status(404).json({
                success: false,
                message: `No movies available in the requested language(s) in ${city}`
            });
        }

        const movies = await movie.find({
            title: { $in: movieTitles }
        });

        if (!movies.length) {
            return res.status(404).json({
                success: false,
                message: `No movie data found for selected titles`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Movies fetched successfully",
            movies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in fetching movies by language",
            error: error.message
        });
    }
};

module.exports = {
    getMovie, addMovie, getMovieFromLocation, getMovieDetails, deleteMovie, comingSoon, getUniqueGenres, getMoviesByGenre,
    getMovieByLanguage
}