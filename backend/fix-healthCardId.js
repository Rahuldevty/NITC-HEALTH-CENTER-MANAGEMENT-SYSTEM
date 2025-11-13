// Script to fix existing users with null healthCardId
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const crypto = require("crypto");

function generateHealthCardId() {
  const prefix = "NITC-HC";
  const randomNum = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${randomNum}`;
}

async function fixHealthCardIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Find all users with null or missing healthCardId
    const usersWithoutCardId = await User.find({
      $or: [{ healthCardId: null }, { healthCardId: { $exists: false } }],
    });

    console.log(
      `Found ${usersWithoutCardId.length} users without healthCardId`
    );

    // Generate unique healthCardId for each user
    for (const user of usersWithoutCardId) {
      let healthCardId;
      let attempts = 0;
      const maxAttempts = 20;

      // Generate unique ID
      while (attempts < maxAttempts) {
        healthCardId = generateHealthCardId();
        const existing = await User.findOne({ healthCardId });
        if (!existing) {
          break;
        }
        attempts++;
      }

      if (attempts >= maxAttempts) {
        console.error(`Failed to generate unique ID for user ${user.email}`);
        continue;
      }

      user.healthCardId = healthCardId;
      await user.save();
      console.log(
        `✅ Fixed user ${user.email} with healthCardId: ${healthCardId}`
      );
    }

    // Drop and recreate the index as sparse
    try {
      await User.collection.dropIndex("healthCardId_1");
      console.log("✅ Dropped old healthCardId index");
    } catch (e) {
      console.log("Index might not exist, continuing...");
    }

    // Create new sparse index
    await User.collection.createIndex(
      { healthCardId: 1 },
      { unique: true, sparse: true }
    );
    console.log("✅ Created sparse unique index on healthCardId");

    console.log("✅ All fixes completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixHealthCardIds();















