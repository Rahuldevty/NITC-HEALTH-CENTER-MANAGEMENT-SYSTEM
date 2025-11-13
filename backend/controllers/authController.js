const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

/* ------------------------ GENERATE HEALTH CARD ID ------------------------ */
function generateHealthCardId() {
  const prefix = "NITC-HC";
  const randomNum = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${randomNum}`;
}

/* ------------------------------ EMAIL SETUP ------------------------------- */
function getTransport() {
  try {
    // Validate required environment variables
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.warn(
        "SMTP configuration is incomplete. Email sending will be skipped."
      );
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error("Error creating email transport:", error.message);
    return null;
  }
}

/* ----------------------------- REGISTER USER ------------------------------ */
exports.registerUser = async (req, res) => {
  try {
    console.log("=== REGISTRATION STARTED ===");
    console.log("Registration attempt started");
    const { name, email, password } = req.body;

    console.log("Received data:", {
      name,
      email: email ? "***" : undefined,
      password: password ? "***" : undefined,
    });

    // Check MongoDB connection
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "MongoDB not connected! Connection state:",
        mongoose.connection.readyState
      );
      return res.status(500).json({
        message: "Database connection error. Please try again later.",
        error: "MongoDB connection not established",
      });
    }
    console.log("MongoDB connection verified");

    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const nitcEmailRegex = /^[a-zA-Z0-9._%+-]+@nitc\.ac\.in$/i;
    if (!nitcEmailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({
        message:
          "Please register using a valid NITC email (e.g., rahul_m251216cs@nitc.ac.in)",
      });
    }

    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists with email:", email);
      return res.status(400).json({ message: "Email already registered" });
    }
    console.log("Email is unique, proceeding with registration");

    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(24).toString("hex");
    console.log("Password hashed, token generated");

    // Generate unique health card ID with retry mechanism
    console.log("Generating unique health card ID...");
    let healthCardId;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      healthCardId = generateHealthCardId();
      const existingCardId = await User.findOne({ healthCardId });
      if (!existingCardId) {
        console.log("Generated unique health card ID:", healthCardId);
        break; // Found unique ID
      }
      console.log("Health card ID collision, retrying...");
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error(
        "Failed to generate unique health card ID after",
        maxAttempts,
        "attempts"
      );
      return res.status(500).json({
        message: "Unable to generate unique health card ID. Please try again.",
      });
    }

    // Ensure healthCardId is never null or undefined
    if (!healthCardId) {
      console.error("healthCardId is null or undefined!");
      return res.status(500).json({
        message: "Error generating health card ID. Please try again.",
      });
    }

    console.log("Creating user object with healthCardId:", healthCardId);
    const user = new User({
      name,
      email,
      passwordHash,
      verified: false,
      verificationToken,
      role: "nitcian",
      healthCardId: healthCardId, // Explicitly ensure it's set
    });

    try {
      console.log("Saving user to database...");
      console.log("User object before save:", {
        name: user.name,
        email: user.email,
        healthCardId: user.healthCardId,
        role: user.role,
      });
      await user.save();
      console.log("User saved successfully with ID:", user._id);
      console.log("Saved user healthCardId:", user.healthCardId);
    } catch (saveError) {
      console.error("Error saving user to database:", saveError);
      console.error("Save error details:", {
        code: saveError.code,
        keyPattern: saveError.keyPattern,
        keyValue: saveError.keyValue,
      });
      // Handle MongoDB duplicate key errors
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyPattern || {})[0];
        console.log(
          "Duplicate key error on field:",
          field,
          "value:",
          saveError.keyValue
        );
        if (field === "email") {
          return res.status(400).json({ message: "Email already registered" });
        } else if (field === "healthCardId") {
          // If healthCardId is null in the error, it means there's already a user with null
          if (saveError.keyValue && saveError.keyValue.healthCardId === null) {
            console.error(
              "Cannot create user: there are existing users with null healthCardId"
            );
            return res.status(500).json({
              message:
                "Database configuration error. Please contact administrator.",
            });
          }
          // Retry registration with a new health card ID
          return res.status(500).json({
            message: "Registration conflict. Please try again.",
          });
        }
      }
      throw saveError; // Re-throw if not a duplicate key error
    }

    // Generate verification link for frontend (localhost:3000)
    console.log("Generating verification link...");
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const verificationLink = `${protocol}://${host.replace(
      ":5000",
      ":3000"
    )}/verify/${verificationToken}`;
    console.log("Verification link:", verificationLink);

    // Try to send email, but don't fail registration if email fails
    console.log("Attempting to send verification email...");
    try {
      const transporter = getTransport();
      if (!transporter) {
        console.log("Email transport not available, skipping email send");
        return res.json({
          message:
            "Registration successful! However, email service is not configured. In development mode, use this link to verify:",
          verificationLink: verificationLink,
        });
      }
      console.log("Email transport created successfully");
      const emailFrom =
        process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@nitc.ac.in";
      console.log("Sending email from:", emailFrom, "to:", user.email);
      await transporter.sendMail({
        from: emailFrom,
        to: user.email,
        subject: "NITC Health Centre - Verify Your Email",
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;background-color:#f9f9f9;">
            <div style="background-color:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align:center;margin-bottom:30px;">
                <h1 style="color:#1a2b47;margin:0;">NITC Health Centre</h1>
              </div>
              
              <h2 style="color:#333;margin-bottom:20px;">Welcome, ${user.name}!</h2>
              
              <p style="color:#555;line-height:1.6;">
                Thank you for registering with the NITC Health Centre Management System. 
                To complete your registration and access all features, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align:center;margin:30px 0;">
                <a href="${verificationLink}" 
                   style="display:inline-block;padding:14px 32px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;box-shadow:0 2px 4px rgba(0,123,255,0.3);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color:#888;font-size:14px;margin-top:30px;border-top:1px solid #eee;padding-top:20px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verificationLink}" style="color:#007bff;word-break:break-all;">${verificationLink}</a>
              </p>
              
              <p style="color:#888;font-size:12px;margin-top:20px;">
                If you didn't create this account, you can safely ignore this email.
              </p>
              
              <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;text-align:center;color:#999;font-size:12px;">
                <p>NITC Health Centre Management System</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        `,
      });

      console.log("Verification email sent successfully");
      res.json({
        message:
          "Registration successful! Please check your NITC email to verify your account.",
        verificationLink:
          process.env.NODE_ENV === "development" ? verificationLink : null,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      console.error("Email error stack:", emailError.stack);
      // Still return success but indicate email wasn't sent
      console.log("Returning success response despite email failure");
      res.json({
        message:
          "Registration successful! However, email could not be sent. In development mode, use this link to verify:",
        verificationLink: verificationLink,
      });
    }
  } catch (error) {
    console.error("=== REGISTRATION ERROR ===");
    console.error("Registration error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      keyPattern: error.keyPattern,
    });

    // Check if response was already sent
    if (res.headersSent) {
      console.error("Response already sent, cannot send error response");
      return;
    }

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          "Validation error: " +
          Object.values(error.errors)
            .map((e) => e.message)
            .join(", "),
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        message: `${
          field === "email" ? "Email" : "Health Card ID"
        } already exists. Please try again.`,
      });
    }

    // Handle MongoDB connection errors
    if (
      error.name === "MongoServerError" ||
      error.name === "MongoNetworkError" ||
      error.name === "MongooseError"
    ) {
      return res.status(500).json({
        message: "Database connection error. Please try again later.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    res.status(500).json({
      message: "Server error during registration. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/* ----------------------------- VERIFY EMAIL ------------------------------- */
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
};

/* ------------------------------- LOGIN USER ------------------------------- */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.verified)
      return res
        .status(403)
        .json({ message: "Email not verified. Please check your inbox." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        healthCardId: user.healthCardId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
