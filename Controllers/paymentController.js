// const Razorpay = require("razorpay");
// const TempBooking = require("../Models/TempBookingModel");
// const Booking = require("../Models/BookingModel"); // your confirmed bookings model

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const createOrder = async (req, res) => {
//   const { tempBookingId } = req.body;
//   if (!tempBookingId) return res.status(400).json({ message: "tempBookingId is required" });

//   try {
//     const tempBooking = await TempBooking.findById(tempBookingId);
//     if (!tempBooking) return res.status(404).json({ message: "TempBooking not found" });

//     // Check if hold expired
//     if (new Date() > tempBooking.hold_expires_at) {
//       return res.status(400).json({ message: "Hold expired. Please select seats again." });
//     }

//     const options = {
//       amount: tempBooking.total_price * 100, // in paise
//       currency: "INR",
//       receipt: tempBooking._id.toString(),
//       payment_capture: 1
//     };

//     const order = await razorpay.orders.create(options);

//     return res.status(200).json({
//       message: "Razorpay order created",
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.RAZORPAY_KEY_ID
//     });
//   } catch (error) {
//     console.error("Error creating Razorpay order:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// };

// module.exports = { createOrder };
