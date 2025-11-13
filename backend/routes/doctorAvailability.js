const express = require("express");
const router = express.Router();
const doctorAvailabilityController = require("../controllers/doctorAvailabilityController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

/* ------------------------ DOCTOR AVAILABILITY ROUTES ------------------------ */

// Set weekly availability (Doctor only)
router.post(
  "/weekly",
  authenticateToken,
  authorizeRoles("doctor"),
  doctorAvailabilityController.setWeeklyAvailability
);

// Get doctor's weekly availability (Doctor only)
router.get(
  "/weekly",
  authenticateToken,
  authorizeRoles("doctor"),
  doctorAvailabilityController.getWeeklyAvailability
);

// Get available slots for a specific date (Public for booking)
router.get("/slots", doctorAvailabilityController.getAvailableSlotsForDate);

module.exports = router;









