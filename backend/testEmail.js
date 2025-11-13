require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  try {
    // ✅ Create transport using your .env settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // ✅ Send test mail
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER, // send it to yourself
      subject: "✅ SMTP Test - NITC Health Centre",
      text: "This is a test email from your backend SMTP setup!",
      html: "<h2>✅ SMTP test successful!</h2><p>If you received this, your email config works.</p>",
    });

    console.log("✅ Email sent successfully!");
    console.log("📩 Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
  }
}

testEmail();
