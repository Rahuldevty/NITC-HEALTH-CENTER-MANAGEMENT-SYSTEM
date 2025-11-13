// Test MongoDB connection script
require("dotenv").config();
const mongoose = require("mongoose");

console.log("🔍 Testing MongoDB Connection...\n");

// Check if MONGO_URI exists
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file!");
  process.exit(1);
}

console.log(
  "📝 Connection String:",
  process.env.MONGO_URI.replace(/\/\/.*@/, "//***:***@")
); // Hide password
console.log("\n🔄 Attempting to connect...\n");

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,
};

mongoose
  .connect(process.env.MONGO_URI, options)
  .then(() => {
    console.log("✅ SUCCESS! MongoDB Connected");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ FAILED! Connection Error:\n");
    console.error("   Error Message:", err.message);
    console.error("\n🔍 Error Details:");

    // Specific error diagnosis
    if (err.message.includes("IP")) {
      console.error("\n   ⚠️  IP Whitelist Issue:");
      console.error("   1. Go to MongoDB Atlas → Network Access");
      console.error("   2. Make sure your IP is added (Status: Active)");
      console.error("   3. Try adding 0.0.0.0/0 temporarily for testing");
      console.error("   4. Wait 2-3 minutes after adding IP");
    }

    if (err.message.includes("authentication")) {
      console.error("\n   ⚠️  Authentication Issue:");
      console.error("   1. Check username and password in MONGO_URI");
      console.error(
        "   2. Verify database user exists in Atlas → Database Access"
      );
      console.error("   3. Make sure password doesn't need URL encoding");
    }

    if (err.message.includes("timeout")) {
      console.error("\n   ⚠️  Timeout Issue:");
      console.error("   1. Check your internet connection");
      console.error("   2. Disable VPN if enabled");
      console.error("   3. Try again in a few minutes");
      console.error("   4. Check if Atlas cluster is running (not paused)");
    }

    if (err.message.includes("ENOTFOUND") || err.message.includes("DNS")) {
      console.error("\n   ⚠️  DNS/Connection String Issue:");
      console.error("   1. Verify MONGO_URI format is correct");
      console.error("   2. Check cluster name in connection string");
      console.error("   3. Make sure no spaces in connection string");
    }

    console.error("\n📋 Connection String Format:");
    console.error(
      "   Correct: mongodb+srv://username:password@cluster.mongodb.net/dbname"
    );
    console.error("   No spaces, correct cluster name, valid credentials\n");

    process.exit(1);
  });

// Handle timeout
setTimeout(() => {
  console.error("\n⏱️  Connection test timed out after 10 seconds");
  console.error("   This usually means:");
  console.error("   1. IP not whitelisted in Atlas");
  console.error("   2. Network connectivity issues");
  console.error("   3. Firewall blocking connection");
  process.exit(1);
}, 15000);

