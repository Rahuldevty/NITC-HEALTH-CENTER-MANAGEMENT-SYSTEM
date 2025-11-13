const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

/* ------------------------ ADMIN ROUTES ------------------------ */

// Get all users with filtering and pagination
router.get(
  "/users",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.getAllUsers
);

// Get user by ID
router.get(
  "/users/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.getUserById
);

// Create new user
router.post(
  "/users",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.createUser
);

// Update user
router.put(
  "/users/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.updateUser
);

// Delete user
router.delete(
  "/users/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.deleteUser
);

// Reset user password
router.put(
  "/users/:userId/reset-password",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.resetUserPassword
);

// Get system statistics
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.getSystemStats
);

// Broadcast email to users (roles optional): { subject, html?, text?, roles?: ["nitcian","staff","doctor","admin"] }
router.post(
  "/broadcast-email",
  authenticateToken,
  authorizeRoles("admin"),
  adminController.broadcastEmail
);

module.exports = router;
