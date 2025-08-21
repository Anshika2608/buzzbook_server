const Movie = require("../Models/movieModel");
const Theater = require("../Models/theaterModel");
const Booking = require("../Models/bookingModel");
const Snack = require("../Models/snackModel");
const User = require("../Models/userModel");

const getStats = async (req, res) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalTheaters = await Theater.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalSnacks = await Snack.countDocuments();
    const totalUsers = await User.countDocuments();

    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, revenue: { $sum: "$total_price" } } }
    ]);

    res.status(200).json({
      totalMovies,
      totalTheaters,
      totalBookings,
      totalSnacks,
      totalUsers,
      totalRevenue: totalRevenue[0]?.revenue || 0
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getStats };
