// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  role: {
    type: String,
    enum: ["nitcian", "staff", "doctor", "admin"],
    default: "nitcian",
  },
  // Health Card Details
  rollNo: { type: String },
  dateOfBirth: { type: Date },
  bloodGroup: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  phoneNumber: { type: String },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },
  allergies: { type: String },
  medications: { type: String },
  medicalHistory: { type: String },
  healthCardId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
