const User = require("../models/User");
const { sendBroadcastEmail } = require("../utils/email");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/* ------------------------ GET ALL USERS (ADMIN) ------------------------ */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, limit = 20, page = 1, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-passwordHash -verificationToken")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ CREATE USER (ADMIN) ------------------------ */
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      rollNo,
      phoneNumber,
      bloodGroup,
      gender,
      dateOfBirth,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required",
      });
    }

    // Validate role
    const validRoles = ["nitcian", "staff", "doctor", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Must be one of: nitcian, staff, doctor, admin",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate health card ID for nitcians only
    // For other roles, don't set healthCardId (undefined, not null)
    let healthCardId = undefined;
    if (role === "nitcian") {
      // Generate unique health card ID with retry mechanism
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const prefix = "NITC-HC";
        const randomNum = crypto.randomBytes(4).toString("hex").toUpperCase();
        healthCardId = `${prefix}-${randomNum}`;

        const existingCardId = await User.findOne({ healthCardId });
        if (!existingCardId) {
          break; // Found unique ID
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return res.status(500).json({
          message:
            "Unable to generate unique health card ID. Please try again.",
        });
      }
    }

    // Create user object - only include healthCardId if it's defined
    const userData = {
      name,
      email,
      passwordHash,
      role,
      verified: true, // Admin-created users are auto-verified
      rollNo: role === "nitcian" ? rollNo : undefined,
      phoneNumber,
      bloodGroup,
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    // Only add healthCardId if it's defined (for nitcians)
    if (healthCardId) {
      userData.healthCardId = healthCardId;
    }

    const user = new User(userData);

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        healthCardId: user.healthCardId,
        rollNo: user.rollNo,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ UPDATE USER (ADMIN) ------------------------ */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      email,
      role,
      rollNo,
      phoneNumber,
      bloodGroup,
      gender,
      dateOfBirth,
      verified,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from changing their own role
    if (req.user.id === userId && role && role !== user.role) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ["nitcian", "staff", "doctor", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          message:
            "Invalid role. Must be one of: nitcian, staff, doctor, admin",
        });
      }
    }

    // Check email uniqueness if changing email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (rollNo !== undefined) user.rollNo = rollNo;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined)
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (verified !== undefined) user.verified = verified;

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        healthCardId: user.healthCardId,
        rollNo: user.rollNo,
        phoneNumber: user.phoneNumber,
        bloodGroup: user.bloodGroup,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ DELETE USER (ADMIN) ------------------------ */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET USER BY ID (ADMIN) ------------------------ */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-passwordHash -verificationToken"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ RESET USER PASSWORD (ADMIN) ------------------------ */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({
      message: "Password reset successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET SYSTEM STATISTICS (ADMIN) ------------------------ */
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNitcians = await User.countDocuments({ role: "nitcian" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalStaff = await User.countDocuments({ role: "staff" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const verifiedUsers = await User.countDocuments({ verified: true });
    const unverifiedUsers = await User.countDocuments({ verified: false });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      totalUsers,
      totalNitcians,
      totalDoctors,
      totalStaff,
      totalAdmins,
      verifiedUsers,
      unverifiedUsers,
      recentRegistrations,
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ BROADCAST EMAIL (ADMIN) ------------------------ */
exports.broadcastEmail = async (req, res) => {
  try {
    const { subject, html, text, roles } = req.body;
    if (!subject || (!html && !text)) {
      return res
        .status(400)
        .json({ message: "Subject and content are required" });
    }

    const roleFilter =
      Array.isArray(roles) && roles.length > 0 ? { role: { $in: roles } } : {};
    const recipients = await User.find({
      ...roleFilter,
      email: { $exists: true },
    }).distinct("email");

    if (recipients.length === 0) {
      return res.status(400).json({ message: "No recipients found" });
    }

    await sendBroadcastEmail({
      recipients,
      subject,
      messageHtml: html,
      messageText: text,
    });

    res.json({
      message: `Broadcast email sent to ${recipients.length} recipients`,
    });
  } catch (error) {
    console.error("Broadcast email error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
