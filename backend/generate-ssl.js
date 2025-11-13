// Simple script to generate self-signed SSL certificates for development
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const certDir = path.join(__dirname, "ssl");
const keyPath = path.join(certDir, "key.pem");
const certPath = path.join(certDir, "cert.pem");

// Create SSL directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log("✅ SSL certificates already exist");
  process.exit(0);
}

console.log("Generating self-signed SSL certificate...");

try {
  // Generate self-signed certificate using OpenSSL
  execSync(
    `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Calicut/O=NITC/CN=localhost"`,
    { stdio: "inherit" }
  );
  console.log("✅ SSL certificates generated successfully!");
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
} catch (error) {
  console.error(
    "❌ Error generating certificates. Make sure OpenSSL is installed."
  );
  console.error(
    "   Windows: Download OpenSSL from https://slproweb.com/products/Win32OpenSSL.html"
  );
  console.error("   Or use the manual method described in the README");
  process.exit(1);
}















