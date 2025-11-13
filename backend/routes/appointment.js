const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

/* ------------------------ APPOINTMENT ROUTES ------------------------ */

// Book appointment (NITCian only)
router.post(
  "/book",
  authenticateToken,
  authorizeRoles("nitcian"),
  appointmentController.bookAppointment
);

// Get patient's appointments (NITCian only)
router.get(
  "/patient",
  authenticateToken,
  authorizeRoles("nitcian"),
  appointmentController.getPatientAppointments
);

// Get doctor's appointments (Doctor only)
router.get(
  "/doctor",
  authenticateToken,
  authorizeRoles("doctor"),
  appointmentController.getDoctorAppointments
);

// Get all appointments (Admin/Staff only)
router.get(
  "/all",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  appointmentController.getAllAppointments
);

// Update appointment status (Doctor/Admin/Staff)
router.put(
  "/:appointmentId/status",
  authenticateToken,
  authorizeRoles("doctor", "admin", "staff"),
  appointmentController.updateAppointmentStatus
);

// Cancel appointment (Patient/Admin/Staff)
router.put(
  "/:appointmentId/cancel",
  authenticateToken,
  authorizeRoles("nitcian", "admin", "staff"),
  appointmentController.cancelAppointment
);

// Get available time slots (Public for booking)
router.get("/slots/available", appointmentController.getAvailableTimeSlots);

// Get doctors list (Public for booking)
router.get("/doctors", appointmentController.getDoctors);

// Get patient consultations (completed appointments) - NITCian only
router.get(
  "/patient/consultations",
  authenticateToken,
  authorizeRoles("nitcian"),
  appointmentController.getPatientConsultations
);

// Request medical certificate - NITCian only
router.post(
  "/:appointmentId/request-certificate",
  authenticateToken,
  authorizeRoles("nitcian"),
  appointmentController.requestCertificate
);

// Verify appointment on visit - Staff/Admin only
router.put(
  "/:appointmentId/verify",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  appointmentController.verifyAppointment
);

// Upload prescription after visit - Staff/Admin only
router.put(
  "/:appointmentId/upload-prescription",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  appointmentController.uploadPrescription
);

// Doctor submits prescription draft (Doctor only)
router.post(
  "/:appointmentId/prescription-draft",
  authenticateToken,
  authorizeRoles("doctor"),
  appointmentController.submitPrescriptionDraft
);

// Staff approves prescription and sends to patient
router.put(
  "/:appointmentId/prescription-approve",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  appointmentController.staffApprovePrescription
);

// Doctor submits medical certificate draft (Doctor only)
router.post(
  "/:appointmentId/certificate-draft",
  authenticateToken,
  authorizeRoles("doctor"),
  appointmentController.submitCertificateDraft
);

// Staff issues certificate and sends to patient
router.put(
  "/:appointmentId/certificate-issue",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  appointmentController.staffIssueCertificate
);

module.exports = router;
