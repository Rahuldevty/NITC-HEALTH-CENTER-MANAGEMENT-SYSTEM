// Test direct MongoDB connection with detailed error info
require("dotenv").config();
const { MongoClient } = require("mongodb");

console.log("🔍 Testing Direct MongoDB Connection (Using Native Driver)...\n");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI not found!");
  process.exit(1);
}

// Hide password in display
const displayUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
console.log("📝 Connection String:", displayUri);
console.log("\n🔄 Attempting connection...\n");

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
});

async function testConnection() {
  try {
    console.log("⏱️  Connecting (timeout: 20 seconds)...\n");

    await client.connect();

    console.log("✅ Connection Successful!\n");

    // Test database access
    const db = client.db("nitc-hcms");
    const adminDb = client.db().admin();

    // List databases
    const dbs = await adminDb.listDatabases();
    console.log("📊 Available Databases:");
    dbs.databases.forEach((db) => {
      console.log(
        `   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`
      );
    });

    // Test collection access
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in 'nitc-hcms' database:`);
    if (collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log("   (No collections found - database might be empty)");
    }

    // Test ping
    await db.command({ ping: 1 });
    console.log("\n✅ Database ping successful!");

    await client.close();
    console.log(
      "\n🎉 All tests passed! MongoDB connection is working perfectly!\n"
    );
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection Failed!\n");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("\n🔍 Detailed Error Analysis:\n");

    // Analyze error type
    if (error.message.includes("IP") || error.message.includes("whitelist")) {
      console.log("⚠️  IP Whitelist Issue:");
      console.log("   1. Go to MongoDB Atlas → Network Access");
      console.log(
        "   2. Check if 0.0.0.0/0 status is 'Active' (not 'Pending')"
      );
      console.log("   3. Wait 3-5 minutes after adding IP");
      console.log("   4. Try refreshing Network Access page");
      console.log(
        "   5. Check if there are multiple projects - ensure you're in the right one\n"
      );
    } else if (
      error.message.includes("authentication") ||
      error.name === "MongoAuthenticationError"
    ) {
      console.log("⚠️  Authentication Issue:");
      console.log("   1. Verify username and password in connection string");
      console.log("   2. Go to Atlas → Database Access");
      console.log("   3. Check if user exists and password is correct");
      console.log("   4. Reset password if needed\n");
    } else if (
      error.message.includes("timeout") ||
      error.name === "MongoServerSelectionError"
    ) {
      console.log("⚠️  Connection Timeout:");
      console.log("   Possible causes:");
      console.log("   1. IP whitelist not active yet (wait 3-5 minutes)");
      console.log("   2. Cluster is paused (check Atlas dashboard)");
      console.log("   3. Network/firewall blocking connection");
      console.log("   4. VPN interfering");
      console.log("   5. Incorrect connection string format\n");

      console.log("   Solutions to try:");
      console.log("   1. Wait 5 minutes and try again");
      console.log("   2. Check cluster status in Atlas");
      console.log("   3. Disable VPN temporarily");
      console.log("   4. Try from a different network");
      console.log("   5. Verify connection string from Atlas Connect button\n");
    } else if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("DNS")
    ) {
      console.log("⚠️  DNS Resolution Issue:");
      console.log("   1. Check your internet connection");
      console.log("   2. Try flushing DNS: ipconfig /flushdns");
      console.log("   3. Check if DNS server is working");
      console.log("   4. Verify connection string hostname is correct\n");
    } else {
      console.log("⚠️  Unknown Error:");
      console.log(`   Full error: ${error.stack}\n`);
    }

    // Additional checks
    console.log("📋 Additional Checks:\n");
    console.log("   1. Verify in Atlas Dashboard:");
    console.log(
      "      - Network Access shows 0.0.0.0/0 with Status: 'Active' ✅"
    );
    console.log("      - Cluster status shows 'Running' (not 'Paused') ✅");
    console.log("      - Database user exists and has permissions ✅");
    console.log("");
    console.log("   2. Connection String Format:");
    console.log(
      "      Should be: mongodb+srv://user:pass@cluster.net/dbname?retryWrites=true&w=majority"
    );
    console.log("");
    console.log("   3. Wait Time:");
    console.log(
      "      - IP whitelist changes can take 3-5 minutes to fully activate"
    );
    console.log("      - Cluster resume can take 5-10 minutes");

    await client.close().catch(() => {});
    process.exit(1);
  }
}

testConnection();

// Overall timeout
setTimeout(() => {
  console.error("\n⏱️  Test timed out after 25 seconds");
  console.error(
    "   This usually means IP whitelist is not active or cluster is paused\n"
  );
  process.exit(1);
}, 25000);













