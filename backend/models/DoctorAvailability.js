const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // Week pattern: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  // Time slots in format "HH:mm" (e.g., "09:00", "14:30")
  timeSlots: [
    {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // Validates HH:mm format
    },
  ],
  // Slot duration in minutes
  duration: {
    type: Number,
    default: 30, // Default 30 minutes per slot
  },
  // Effective date range (optional - for temporary schedules)
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null, // null means ongoing
  },
  // Consultation type (if different slots for different types)
  consultationType: {
    type: String,
    enum: ["General", "Follow-up", "Online", "All"],
    default: "All",
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
doctorAvailabilitySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for efficient queries
doctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });
doctorAvailabilitySchema.index({ doctorId: 1, isActive: 1 });

module.exports = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);









