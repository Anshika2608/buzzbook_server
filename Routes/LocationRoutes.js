// routes/locationRoutes.js
const express = require("express");
const router = express.Router();

const { getLocations } = require("../Controllers/locationController");


router.get("/", getLocations);

module.exports = router;