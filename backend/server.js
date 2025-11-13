require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const healthCardRoutes = require("./routes/healthCard");
const appointmentRoutes = require("./routes/appointment");
const adminRoutes = require("./routes/admin");
const doctorAvailabilityRoutes = require("./routes/doctorAvailability");
const cron = require("node-cron");
const Appointment = require("./models/Appointment");
const { sendAppointmentReminder } = require("./utils/email");

const app = express();

// CORS configuration - allow all origins for development
// In production, restrict to your domain
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Increase JSON payload limit to handle file uploads (base64 encoded)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env file!");
  console.error(
    "Please create a .env file with: MONGO_URI=mongodb://localhost:27017/nitc-hcms"
  );
  console.error(
    "Or for MongoDB Atlas: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms"
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    // These options are now default in Mongoose 6+, but keeping for compatibility
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Increased to 15s to allow more time
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    retryWrites: true,
    w: "majority",
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error("   Error:", err.message);

    // Provide helpful error messages based on error type
    if (err.message.includes("authentication failed")) {
      console.error(
        "\n   💡 Authentication failed. Check your username and password in MONGO_URI"
      );
    } else if (err.message.includes("ECONNREFUSED")) {
      console.error("\n   💡 Connection refused. Is MongoDB running?");
      console.error(
        "   For local MongoDB: Make sure MongoDB service is running"
      );
      console.error("   For MongoDB Atlas: Check your network/IP whitelist");
    } else if (
      err.message.includes("ENOTFOUND") ||
      err.message.includes("DNS")
    ) {
      console.error(
        "\n   💡 Cannot resolve hostname. Check your MONGO_URI connection string"
      );
    } else if (err.message.includes("timeout")) {
      console.error(
        "\n   💡 Connection timeout. Check your network connection and MongoDB server status"
      );
    } else if (
      err.message.includes("password") ||
      err.message.includes("credentials")
    ) {
      console.error(
        "\n   💡 Invalid credentials. Check username and password in MONGO_URI"
      );
    }

    console.error("\n   📝 Example .env configuration:");
    console.error(
      "   For local MongoDB: MONGO_URI=mongodb://localhost:27017/nitc-hcms"
    );
    console.error(
      "   For MongoDB Atlas: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms"
    );

    // Don't exit in production, allow the server to start and show connection status
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "\n   ⚠️  Server will continue to run, but database operations will fail."
      );
      console.error(
        "   Please fix the MongoDB connection and restart the server."
      );
    }
  });

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// Test endpoint to verify connectivity
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is accessible!",
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthCardRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor-availability", doctorAvailabilityRoutes);

const PORT = process.env.PORT || 5000;

// Support HTTPS if SSL certificates exist
const https = require("https");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "ssl", "key.pem");
const certPath = path.join(__dirname, "ssl", "cert.pem");

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  // HTTPS mode
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  // Listen on all interfaces (0.0.0.0) so mobile devices can access via IP
  https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on HTTPS port ${PORT}`);
    console.log(`   Access at: https://localhost:${PORT}`);
    console.log(`   Mobile access: https://YOUR_IP:${PORT}`);
  });
} else {
  // HTTP mode (fallback)
  // Listen on all interfaces (0.0.0.0) so mobile devices can access via IP
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on HTTP port ${PORT}`);
    console.log(`   Access at: http://localhost:${PORT}`);
    console.log(`   Mobile access: http://YOUR_IP:${PORT}`);
    console.log(
      `   Note: For HTTPS, generate SSL certificates (see generate-ssl.js)`
    );
  });
}

// Reminder cron: run every 15 minutes, send reminders for appointments within next 24 hours, not yet reminded
cron.schedule("*/15 * * * *", async () => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find appointments between now and 24h, not reminded yet
    const appts = await Appointment.find({
      appointmentDate: { $gte: now, $lte: in24h },
      status: { $in: ["scheduled", "confirmed"] },
      reminderSentAt: { $exists: false },
    })
      .limit(200)
      .lean();

    for (const appt of appts) {
      try {
        await sendAppointmentReminder({
          patientEmail: appt.patientEmail,
          patientName: appt.patientName,
          doctorName: appt.doctorName,
          appointmentDate: appt.appointmentDate,
          appointmentTime: appt.appointmentTime,
          purpose: appt.purpose,
        });
        await Appointment.updateOne(
          { _id: appt._id },
          { $set: { reminderSentAt: new Date() } }
        );
      } catch (_) {}
    }
  } catch (err) {
    console.error("Reminder cron failed:", err.message);
  }
});
