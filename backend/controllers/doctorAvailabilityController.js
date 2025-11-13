const DoctorAvailability = require("../models/DoctorAvailability");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

/* ------------------------ SET DOCTOR WEEKLY AVAILABILITY ------------------------ */
exports.setWeeklyAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { weeklySchedule } = req.body;

    // Verify user is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can set availability" });
    }

    // Validate weekly schedule format
    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({
        message: "weeklySchedule must be an array",
      });
    }

    // Process each day's schedule
    const availabilityRecords = [];
    const errors = [];

    for (const daySchedule of weeklySchedule) {
      const { dayOfWeek, timeSlots, duration, consultationType, isActive } =
        daySchedule;

      // Validate day of week
      if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
        errors.push(`Invalid dayOfWeek for day ${dayOfWeek}`);
        continue;
      }

      // Validate time slots
      if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
        // If no time slots, skip this day (doctor not available)
        continue;
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const invalidTimes = timeSlots.filter((time) => !timeRegex.test(time));
      if (invalidTimes.length > 0) {
        errors.push(
          `Invalid time format for day ${dayOfWeek}: ${invalidTimes.join(", ")}`
        );
        continue;
      }

      // Find existing availability for this day
      const existingAvailability = await DoctorAvailability.findOne({
        doctorId,
        dayOfWeek,
      });

      if (existingAvailability) {
        // Update existing
        existingAvailability.timeSlots = timeSlots;
        if (duration !== undefined) existingAvailability.duration = duration;
        if (consultationType !== undefined)
          existingAvailability.consultationType = consultationType;
        if (isActive !== undefined) existingAvailability.isActive = isActive;
        await existingAvailability.save();
        availabilityRecords.push(existingAvailability);
      } else {
        // Create new
        const newAvailability = new DoctorAvailability({
          doctorId,
          dayOfWeek,
          timeSlots,
          duration: duration || 30,
          consultationType: consultationType || "All",
          isActive: isActive !== undefined ? isActive : true,
        });
        await newAvailability.save();
        availabilityRecords.push(newAvailability);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Some errors occurred",
        errors,
        availability: availabilityRecords,
      });
    }

    res.json({
      message: "Weekly availability set successfully",
      availability: availabilityRecords,
    });
  } catch (error) {
    console.error("Set weekly availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET DOCTOR WEEKLY AVAILABILITY ------------------------ */
exports.getWeeklyAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Verify user is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can view availability" });
    }

    const availability = await DoctorAvailability.find({
      doctorId,
      isActive: true,
    }).sort({ dayOfWeek: 1 });

    // Format as weekly schedule
    const weeklySchedule = [];
    for (let day = 0; day < 7; day++) {
      const dayAvailability = availability.find((a) => a.dayOfWeek === day);
      weeklySchedule.push({
        dayOfWeek: day,
        dayName: getDayName(day),
        timeSlots: dayAvailability?.timeSlots || [],
        duration: dayAvailability?.duration || 30,
        consultationType: dayAvailability?.consultationType || "All",
        isActive: dayAvailability?.isActive ?? false,
      });
    }

    res.json({
      doctorId,
      doctorName: doctor.name,
      weeklySchedule,
    });
  } catch (error) {
    console.error("Get weekly availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET AVAILABLE SLOTS FOR DATE ------------------------ */
exports.getAvailableSlotsForDate = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        message: "Doctor ID and date are required",
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get doctor's availability for this day of week
    const dayAvailability = await DoctorAvailability.findOne({
      doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (!dayAvailability || dayAvailability.timeSlots.length === 0) {
      return res.json({
        date: targetDate.toISOString().split("T")[0],
        doctorId,
        doctorName: doctor.name,
        availableSlots: [],
        message: "Doctor not available on this day",
      });
    }

    // Get booked appointments for the day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: targetDate,
        $lt: nextDay,
      },
      status: { $in: ["scheduled", "confirmed", "in-progress"] },
    }).select("appointmentTime");

    const bookedTimes = bookedAppointments.map((apt) => apt.appointmentTime);

    // Filter available slots (remove booked ones)
    const availableSlots = dayAvailability.timeSlots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    res.json({
      date: targetDate.toISOString().split("T")[0],
      doctorId,
      doctorName: doctor.name,
      availableSlots,
      totalSlots: dayAvailability.timeSlots.length,
      bookedSlots: bookedTimes.length,
    });
  } catch (error) {
    console.error("Get available slots for date error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ HELPER FUNCTION ------------------------ */
function getDayName(dayOfWeek) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayOfWeek];
}









