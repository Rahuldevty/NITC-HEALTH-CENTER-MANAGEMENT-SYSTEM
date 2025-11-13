// Comprehensive MongoDB connection diagnosis
require("dotenv").config();
const mongoose = require("mongoose");
const https = require("https");
const dns = require("dns").promises;

console.log("🔍 Comprehensive MongoDB Connection Diagnosis\n");

// Step 1: Check .env file
console.log("1️⃣ Checking .env configuration...");
if (!process.env.MONGO_URI) {
  console.error("   ❌ MONGO_URI not found in .env!");
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI;
const hiddenUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log(`   ✅ MONGO_URI found: ${hiddenUri}\n`);

// Step 2: Parse connection string
console.log("2️⃣ Parsing connection string...");
let clusterHost, username, password, database;

try {
  if (mongoUri.startsWith("mongodb+srv://")) {
    const match = mongoUri.match(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/
    );
    if (match) {
      username = match[1];
      password = match[2];
      clusterHost = match[3];
      database = match[4];
      console.log(`   ✅ Parsed successfully:`);
      console.log(`      Host: ${clusterHost}`);
      console.log(`      Database: ${database}`);
      console.log(`      Username: ${username}\n`);
    } else {
      console.error("   ❌ Invalid connection string format!\n");
      process.exit(1);
    }
  } else {
    console.error("   ⚠️  Not using mongodb+srv:// protocol\n");
  }
} catch (error) {
  console.error("   ❌ Error parsing connection string:", error.message);
  process.exit(1);
}

// Step 3: Test DNS resolution
console.log("3️⃣ Testing DNS resolution...");
(async () => {
  try {
    const addresses = await dns.resolve4(clusterHost);
    console.log(`   ✅ DNS resolved successfully:`);
    console.log(`      IP Addresses: ${addresses.join(", ")}\n`);
  } catch (error) {
    console.error(`   ❌ DNS resolution failed: ${error.message}`);
    console.error(`      This means the hostname cannot be found.\n`);
  }

  // Step 4: Test HTTPS connectivity to Atlas
  console.log("4️⃣ Testing network connectivity to MongoDB Atlas...");
  const testUrl = `https://${clusterHost}`;

  return new Promise((resolve) => {
    const req = https.request(testUrl, { timeout: 5000 }, (res) => {
      console.log(`   ✅ Can reach MongoDB Atlas server`);
      console.log(`      Status: ${res.statusCode}\n`);
      resolve();
    });

    req.on("error", (error) => {
      console.error(`   ❌ Cannot reach MongoDB Atlas server`);
      console.error(`      Error: ${error.message}`);
      console.error(`      This suggests network connectivity issues.\n`);
      resolve();
    });

    req.on("timeout", () => {
      console.error(`   ❌ Connection timeout to MongoDB Atlas`);
      console.error(
        `      This suggests your IP might be blocked or firewall is blocking.\n`
      );
      req.destroy();
      resolve();
    });

    req.setTimeout(5000);
    req.end();
  });
})().then(() => {
  // Step 5: Test MongoDB connection
  console.log("5️⃣ Testing MongoDB connection...");
  console.log("   Attempting to connect (this may take up to 15 seconds)...\n");

  const options = {
    serverSelectionTimeoutMS: 15000, // 15 seconds
    socketTimeoutMS: 45000,
  };

  mongoose
    .connect(mongoUri, options)
    .then(() => {
      console.log("   ✅ SUCCESS! MongoDB Connected");
      console.log(`      Database: ${mongoose.connection.name}`);
      console.log(`      Host: ${mongoose.connection.host}`);
      console.log(`      Ready State: ${mongoose.connection.readyState}\n`);
      console.log(
        "🎉 All checks passed! Your MongoDB connection is working.\n"
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("   ❌ FAILED! Connection Error\n");
      console.error(`   Error: ${err.message}\n`);

      console.log("📋 Diagnosis Summary:\n");

      if (err.message.includes("IP") || err.message.includes("whitelist")) {
        console.log("   🔴 PROBLEM: IP Address not whitelisted");
        console.log("   Solution:");
        console.log("   1. Go to: https://cloud.mongodb.com/");
        console.log("   2. Click 'Network Access'");
        console.log("   3. Add your current IP address");
        console.log("   4. Wait 2-3 minutes for activation\n");
      } else if (err.message.includes("timeout")) {
        console.log("   🔴 PROBLEM: Connection Timeout");
        console.log("   Possible causes:");
        console.log("   1. IP address not whitelisted in MongoDB Atlas");
        console.log("   2. Firewall blocking connection");
        console.log("   3. VPN interfering with connection");
        console.log("   4. MongoDB Atlas cluster is paused");
        console.log("   5. Network connectivity issues\n");

        console.log("   Solutions to try:");
        console.log("   1. Add 0.0.0.0/0 to Network Access (allow all IPs)");
        console.log("   2. Disable VPN temporarily");
        console.log("   3. Check firewall settings");
        console.log("   4. Verify cluster is running in Atlas dashboard");
        console.log("   5. Wait 5-10 minutes after adding IP\n");
      } else if (err.message.includes("authentication")) {
        console.log("   🔴 PROBLEM: Authentication Failed");
        console.log("   Solution:");
        console.log("   1. Verify username and password in MONGO_URI");
        console.log("   2. Check Database Access in Atlas");
        console.log("   3. Ensure user has proper permissions\n");
      } else {
        console.log("   🔴 PROBLEM: Unknown error");
        console.log(`   Error details: ${err.message}\n`);
      }

      console.log("📝 Next Steps:");
      console.log("   1. Open MongoDB Atlas dashboard");
      console.log("   2. Go to Network Access section");
      console.log("   3. Add your IP address (14.139.185.115) or 0.0.0.0/0");
      console.log("   4. Wait 2-5 minutes");
      console.log("   5. Run this test again\n");

      process.exit(1);
    });

  // Overall timeout
  setTimeout(() => {
    console.error("\n⏱️  Overall test timed out after 20 seconds");
    console.error("   This usually indicates:");
    console.error("   - IP not whitelisted");
    console.error("   - Network connectivity issues");
    console.error("   - Firewall blocking connection\n");
    process.exit(1);
  }, 20000);
});












