const Theater = require("../Models/theaterModel"); 

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

    
    const cityNames = cities.map((c) => c.city);

    res.status(200).json(cityNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};


module.exports = { getLocations };
