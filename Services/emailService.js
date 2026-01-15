const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async ({ to, subject, html }) => {
  try {
    await sgMail.send({
      to,
      from: {
        email: process.env.FROM_EMAIL,
        name: "BuzzBook",
      },
      subject,
      html,
    });

    console.log(`Email sent to ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    throw new Error("Email sending failed");
  }
};


const sendOtpEmail = async ({ email, otp }) => {
  const html = `
    <h3>Email Verification for BuzzBook</h3>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email",
    html,
  });
};


const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h3>Password Reset</h3>
      <p>This link is valid for <b>20 minutes</b>.</p>
      <a href="${resetUrl}" style="
        padding:10px 16px;
        background:#000;
        color:#fff;
        text-decoration:none;
        border-radius:6px;
        display:inline-block;
        margin-top:10px;
      ">Reset Password</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html,
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
};
