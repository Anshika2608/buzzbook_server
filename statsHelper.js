const Movie = require("./Models/movieModel");
const Theater = require("./Models/theaterModel");
const Booking = require("./Models/BookingModel");
const Snack = require("./Models/snackModel");
const User = require("./Models/userModel");

const fetchStats = async () => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalTheaters = await Theater.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalSnacks = await Snack.countDocuments();
    const totalUsers = await User.countDocuments();

    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, revenue: { $sum: "$amount" } } }
    ]);

    return {
      totalMovies,
      totalTheaters,
      totalBookings,
      totalSnacks,
      totalUsers,
      totalRevenue: totalRevenue[0]?.revenue || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
};

module.exports = fetchStats;
