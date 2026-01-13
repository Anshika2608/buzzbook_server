const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const { confirmBooking } = require("./bookingController")
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const options = {
      amount: amount * 100,
      currency,
      receipt: receipt || "receipt_order_" + Math.floor(Math.random() * 10000),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return res.status(500).json({ success: false, message: "Unable to create order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails
    } = req.body;

    // Validate Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature"
      });
    }

    // User is authenticated now (coming from Authenticate middleware)
    const user_id = req.userId;
    const user_email = req.rootUser.email;

    // Attach correct user data to bookingDetails
    const updatedBookingDetails = {
      ...bookingDetails,
      user_id,
      user_email,
      paymentId: razorpay_payment_id
    };

    // Confirm booking using the REAL authenticated user
    await confirmBooking(
      {
        body: updatedBookingDetails,
        userId: user_id,
        rootUser: req.rootUser
      },
      res
    );

  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
      error
    });
  }
};

module.exports = { createOrder, verifyPayment };
