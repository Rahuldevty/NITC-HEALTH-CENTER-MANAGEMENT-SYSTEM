const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  updateHealthCard,
  getHealthCard,
  scanHealthCard,
  getPatientByCardId,
  createScanLink,
  viewPatientByToken,
} = require("../controllers/healthCardController");

const router = express.Router();

// Update or create health card (users only)
router.put("/update", authenticateToken, updateHealthCard);

// Get health card with QR code (users only)
router.get("/card", authenticateToken, getHealthCard);

// Scan QR code to get patient details (staff, doctor, admin)
router.post(
  "/scan",
  authenticateToken,
  authorizeRoles("staff", "doctor", "admin"),
  scanHealthCard
);

// Get patient by health card ID (staff, doctor, admin)
router.get(
  "/patient/:cardId",
  authenticateToken,
  authorizeRoles("staff", "doctor", "admin"),
  getPatientByCardId
);

// Create shareable link from QR scan (no auth required - mobile scanner)
router.post("/create-link", createScanLink);

// View patient via shareable token (public, no auth)
router.get("/view/:token", viewPatientByToken);

module.exports = router;
