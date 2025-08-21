const express = require("express");
const router= express.Router();
const { getStats } = require("../Controllers/statsController");
router.get("/get_stats", getStats);
module.exports = router;
