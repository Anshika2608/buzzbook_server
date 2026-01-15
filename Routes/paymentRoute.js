const express = require("express");
const router = express.Router();
const {createOrder,verifyPayment} = require("../Controllers/paymentController");
const {authenticate}  = require("../Middleware/Authenticate");
router.post("/create-order", createOrder);
router.post("/capture-order",authenticate,verifyPayment);
module.exports = router;
