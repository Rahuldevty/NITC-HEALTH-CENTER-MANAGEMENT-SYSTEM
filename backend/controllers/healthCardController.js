const User = require("../models/User");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Store temporary scan tokens (in-memory cache)
// In production, consider using Redis or a database
const scanTokens = new Map();
const TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of scanTokens.entries()) {
    if (data.expiresAt < now) {
      scanTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

/* ------------------------ GENERATE HEALTH CARD ID ------------------------ */
function generateHealthCardId() {
  const prefix = "NITC-HC";
  const randomNum = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${randomNum}`;
}

/* --------------------- UPDATE OR CREATE HEALTH CARD --------------------- */
exports.updateHealthCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      rollNo,
      dateOfBirth,
      bloodGroup,
      gender,
      phoneNumber,
      emergencyContact,
      emergencyPhone,
      allergies,
      medications,
      medicalHistory,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate health card ID if it doesn't exist
    if (!user.healthCardId) {
      user.healthCardId = generateHealthCardId();
    }

    // Update health card details
    if (rollNo) user.rollNo = rollNo;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (gender) user.gender = gender;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (emergencyPhone) user.emergencyPhone = emergencyPhone;
    if (allergies) user.allergies = allergies;
    if (medications) user.medications = medications;
    if (medicalHistory) user.medicalHistory = medicalHistory;

    await user.save();

    res.json({
      message: "Health card updated successfully",
      healthCardId: user.healthCardId,
    });
  } catch (error) {
    console.error("Update health card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ----------------------- GET HEALTH CARD DETAILS ----------------------- */
exports.getHealthCard = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "-passwordHash -verificationToken"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate QR code data URL
    const qrData = {
      healthCardId: user.healthCardId,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      rollNo: user.rollNo,
    };

    let qrCodeDataURL;
    try {
      qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 300,
      });
    } catch (qrError) {
      console.error("QR code generation error:", qrError);
      return res.status(500).json({ message: "Failed to generate QR code" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        allergies: user.allergies,
        medications: user.medications,
        medicalHistory: user.medicalHistory,
        healthCardId: user.healthCardId,
        verified: user.verified,
      },
      qrCode: qrCodeDataURL,
    });
  } catch (error) {
    console.error("Get health card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------- SCAN QR CODE - GET PATIENT DETAILS ------------------ */
exports.scanHealthCard = async (req, res) => {
  try {
    const { qrData } = req.body;

    console.log("=== QR SCAN REQUEST ===");
    console.log("Received QR data:", qrData);
    console.log("QR data type:", typeof qrData);
    console.log("QR data length:", qrData?.length);

    if (!qrData) {
      console.log("Error: QR data is missing");
      return res.status(400).json({ message: "QR data is required" });
    }

    // Trim and clean the data
    const cleanedQrData = String(qrData).trim();
    console.log("Cleaned QR data:", cleanedQrData);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedQrData);
      console.log("Successfully parsed as JSON:", parsedData);
    } catch (parseError) {
      console.log("Not valid JSON, trying as healthCardId string");
      console.log("Parse error:", parseError.message);

      // If it's not JSON, try as healthCardId string
      const user = await User.findOne({ healthCardId: cleanedQrData }).select(
        "-passwordHash -verificationToken"
      );
      if (!user) {
        console.log("User not found with healthCardId:", cleanedQrData);
        return res.status(404).json({
          message: "Invalid QR code. No user found with this health card ID.",
        });
      }
      console.log("Found user by healthCardId:", user.email);
      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          rollNo: user.rollNo,
          bloodGroup: user.bloodGroup,
          gender: user.gender,
          phoneNumber: user.phoneNumber,
          emergencyContact: user.emergencyContact,
          emergencyPhone: user.emergencyPhone,
          allergies: user.allergies,
          medications: user.medications,
          medicalHistory: user.medicalHistory,
          healthCardId: user.healthCardId,
          verified: user.verified,
        },
      });
    }

    const { healthCardId, userId } = parsedData;
    console.log(
      "Extracted from JSON - healthCardId:",
      healthCardId,
      "userId:",
      userId
    );

    if (!healthCardId && !userId) {
      console.log("Error: Both healthCardId and userId are missing");
      return res
        .status(400)
        .json({ message: "QR code is missing required information." });
    }

    // Find user by healthCardId or userId
    const query = {
      $or: [],
    };

    if (healthCardId) {
      query.$or.push({ healthCardId });
    }
    if (userId) {
      query.$or.push({ _id: userId });
    }

    console.log("Searching for user with query:", JSON.stringify(query));
    const user = await User.findOne(query).select(
      "-passwordHash -verificationToken"
    );

    if (!user) {
      console.log(
        "User not found with healthCardId:",
        healthCardId,
        "or userId:",
        userId
      );
      return res
        .status(404)
        .json({ message: "Invalid QR code. Patient not found." });
    }

    console.log("Found user:", user.email);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        allergies: user.allergies,
        medications: user.medications,
        medicalHistory: user.medicalHistory,
        healthCardId: user.healthCardId,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Scan health card error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- GET PATIENT BY HEALTH CARD ID (for staff/doctor/admin) ---------------- */
exports.getPatientByCardId = async (req, res) => {
  try {
    const { cardId } = req.params;

    const user = await User.findOne({ healthCardId: cardId }).select(
      "-passwordHash -verificationToken"
    );

    if (!user) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        allergies: user.allergies,
        medications: user.medications,
        medicalHistory: user.medicalHistory,
        healthCardId: user.healthCardId,
        verified: user.verified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get patient by card ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ----------- CREATE SHAREABLE LINK FROM QR SCAN (MOBILE) ----------- */
exports.createScanLink = async (req, res) => {
  try {
    const { qrData } = req.body;

    console.log("=== CREATE SCAN LINK REQUEST ===");
    console.log("Received QR data:", qrData);

    if (!qrData) {
      return res.status(400).json({ message: "QR data is required" });
    }

    // Clean the data
    const cleanedQrData = String(qrData).trim();

    // Parse QR data and find user (same logic as scanHealthCard)
    let user = null;

    try {
      const parsedData = JSON.parse(cleanedQrData);
      const { healthCardId, userId } = parsedData;

      if (!healthCardId && !userId) {
        return res
          .status(400)
          .json({ message: "QR code is missing required information." });
      }

      const query = { $or: [] };
      if (healthCardId) query.$or.push({ healthCardId });
      if (userId) query.$or.push({ _id: userId });

      user = await User.findOne(query).select(
        "-passwordHash -verificationToken"
      );
    } catch (parseError) {
      // Try as healthCardId string
      user = await User.findOne({ healthCardId: cleanedQrData }).select(
        "-passwordHash -verificationToken"
      );
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid QR code. Patient not found." });
    }

    // Generate temporary token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    // Store patient data with token
    scanTokens.set(token, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        allergies: user.allergies,
        medications: user.medications,
        medicalHistory: user.medicalHistory,
        healthCardId: user.healthCardId,
        verified: user.verified,
      },
      expiresAt,
      createdAt: Date.now(),
    });

    // Generate shareable link
    const protocol = req.protocol || "http";
    const host = req.get("host") || "localhost:3000";
    const shareLink = `${protocol}://${host.replace(
      ":5000",
      ":3000"
    )}/view-patient/${token}`;

    console.log("Generated share link for user:", user.email);

    res.json({
      success: true,
      shareLink,
      token,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("Create scan link error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ----------- VIEW PATIENT VIA SHAREABLE LINK ----------- */
exports.viewPatientByToken = async (req, res) => {
  try {
    const { token } = req.params;

    console.log("=== VIEW PATIENT BY TOKEN ===");
    console.log("Token:", token);

    const scanData = scanTokens.get(token);

    if (!scanData) {
      return res.status(404).json({ message: "Invalid or expired link" });
    }

    if (scanData.expiresAt < Date.now()) {
      scanTokens.delete(token);
      return res
        .status(410)
        .json({ message: "Link has expired. Please scan again." });
    }

    console.log("Patient data found for:", scanData.user.email);

    res.json({
      success: true,
      user: scanData.user,
    });
  } catch (error) {
    console.error("View patient by token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
