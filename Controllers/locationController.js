// controllers/locationController.js
const Theater = require("../Models/theaterModel"); // adjust path as needed

const getLocations = async (req, res) => {
  try {
    const cities = await Theater.aggregate([
      {
        $group: {
          _id: "$location.city"
        }
      },
      {
        $project: {
          _id: 0,
          city: "$_id"
        }
      }
    ]);

    res.status(200).json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

module.exports = { getLocations };
