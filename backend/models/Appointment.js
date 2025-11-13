const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  // Patient information
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  patientName: {
    type: String,
    required: true,
  },
  patientEmail: {
    type: String,
    required: true,
  },
  patientPhone: {
    type: String,
  },
  healthCardId: {
    type: String,
    required: true,
  },

  // Doctor information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },

  // Appointment details
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 30, // in minutes
  },

  // Appointment type and purpose
  appointmentType: {
    type: String,
    enum: [
      "consultation",
      "follow-up",
      "emergency",
      "routine-checkup",
      "vaccination",
      "other",
    ],
    default: "consultation",
  },
  purpose: {
    type: String,
    required: true,
  },
  symptoms: {
    type: String,
  },

  // Status and priority
  status: {
    type: String,
    enum: [
      "scheduled",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "no-show",
    ],
    default: "scheduled",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  // Medical notes
  doctorNotes: {
    type: String,
  },
  prescription: {
    type: String,
  },
  prescriptionFile: {
    type: String, // Path to uploaded prescription file
  },
  prescriptionHtml: {
    type: String, // Rendered HTML draft submitted by doctor
  },
  diagnosis: {
    type: String,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  followUpDate: {
    type: Date,
  },

  // Appointment verification
  verifiedByStaff: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Reminder emails
  reminderSentAt: {
    type: Date,
  },

  // Medical certificate
  certificateRequested: {
    type: Boolean,
    default: false,
  },
  certificateRequestedAt: {
    type: Date,
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificateIssuedAt: {
    type: Date,
  },
  certificateFile: {
    type: String, // Path to issued certificate file
  },
  certificateDraftHtml: {
    type: String, // Rendered HTML draft submitted by doctor
  },
  certificateDraftGenerated: {
    type: Boolean,
    default: false, // True if doctor generated a digital certificate file
  },
  certificateDraftGeneratedAt: {
    type: Date,
  },

  // System fields
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cancellationReason: {
    type: String,
  },
});

// Update the updatedAt field before saving
appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ certificateRequested: 1 });
appointmentSchema.index({ verifiedByStaff: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
