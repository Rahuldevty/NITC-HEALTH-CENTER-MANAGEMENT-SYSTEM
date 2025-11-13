# HTTPS Setup Guide for Camera Access

## Quick Setup (Using Create React App's Built-in HTTPS)

### Option 1: Simple Method (Recommended for Testing)

**Frontend:**

```bash
cd frontend
npm run start:https
```

This will start React with HTTPS using a self-signed certificate. Your browser will show a security warning - click "Advanced" → "Proceed to localhost" to accept it.

**Backend:**
The backend will automatically use HTTPS if SSL certificates are present, or HTTP if not (for backward compatibility).

**To generate SSL certificates:**

```bash
cd backend
npm run generate-ssl
```

**Note:** You need OpenSSL installed. If you don't have it:

- Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
- Or use the manual method below

### Option 2: Manual Certificate Generation (If OpenSSL is not available)

1. **Install OpenSSL** (if not installed):

   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html
   - Mac: Usually pre-installed, or `brew install openssl`
   - Linux: `sudo apt-get install openssl`

2. **Generate certificates:**

   ```bash
   cd backend
   mkdir ssl
   cd ssl
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=IN/ST=Kerala/L=Calicut/O=NITC/CN=localhost"
   ```

3. **Start servers:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend (HTTPS)
   cd frontend
   npm run start:https
   ```

4. **Accept security warning:**
   - Browser will show "Your connection is not private"
   - Click "Advanced"
   - Click "Proceed to localhost (unsafe)" - this is safe for local development

### Access URLs:

- **Frontend (HTTPS):** https://localhost:3000
- **Backend (HTTPS):** https://localhost:5000
- **Mobile Scanner:** https://YOUR_IP:3000/mobile-scanner (use your PC's IP)

### For Mobile Device Access:

1. Get your PC's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On mobile, access: `https://YOUR_IP:3000/mobile-scanner`
3. Accept the security warning on mobile browser (it's safe for local dev)

### Troubleshooting:

- **Certificate errors are normal** - they're self-signed certificates for development
- **Camera should work** once you accept the certificate warning
- **Make sure both devices are on same network** for IP access
















