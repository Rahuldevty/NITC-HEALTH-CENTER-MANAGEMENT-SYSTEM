# Fix MongoDB Atlas IP Whitelist Error

## Problem

```
❌ MongoDB Connection Error:
Error: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Add Your IP to MongoDB Atlas Whitelist

### Step 1: Get Your Current IP Address

**Windows PowerShell:**

```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

**Or use a browser:**

- Visit: https://www.whatismyip.com/
- Copy your IPv4 address

### Step 2: Add IP to MongoDB Atlas

1. **Log in to MongoDB Atlas**

   - Go to: https://cloud.mongodb.com/
   - Sign in with your account

2. **Navigate to Network Access**

   - Click on your cluster name
   - In the left sidebar, click **"Network Access"** (or **"Security" → "Network Access"**)

3. **Add IP Address**

   - Click **"Add IP Address"** button
   - Choose one of these options:

   **Option A: Add Your Current IP (Recommended for Production)**

   - Click **"Add Current IP Address"** button (it should auto-detect)
   - Or manually enter your IP address
   - Click **"Confirm"**

   **Option B: Allow All IPs (For Development Only)**

   - Click **"Add IP Address"**
   - Enter: `0.0.0.0/0`
   - Comment: "Allow all IPs for development"
   - Click **"Confirm"**
   - ⚠️ **Warning:** This allows access from anywhere. Only use for development!

4. **Wait for Activation**
   - It may take 1-2 minutes for the IP whitelist to activate
   - You'll see a "Pending" status that changes to "Active"

### Step 3: Verify Connection

After adding your IP, restart your backend server:

```powershell
cd backend
node server.js
```

You should see:

```
✅ MongoDB Connected Successfully
   Database: nitc-hcms
   Host: ...
```

## Alternative: Use Local MongoDB

If you can't access Atlas or want to use local MongoDB:

1. **Install MongoDB locally** (if not installed)

   - Download: https://www.mongodb.com/try/download/community

2. **Start MongoDB**

   ```powershell
   # Check if service exists
   Get-Service MongoDB

   # Start service
   Start-Service MongoDB
   ```

3. **Update .env file**

   ```env
   MONGO_URI=mongodb://localhost:27017/nitc-hcms
   ```

4. **Restart server**

## Quick Fix (Allow All IPs for Development)

If you want to quickly allow all IPs for development:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Enter: `0.0.0.0/0`
4. Comment: "Development - Allow all"
5. Click "Confirm"
6. Wait 1-2 minutes
7. Restart your server

⚠️ **Important:** Remove `0.0.0.0/0` before deploying to production!

## Still Not Working?

### Check These:

1. **Verify MONGO_URI in .env**

   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms
   ```

   - Make sure username and password are correct
   - No spaces in the connection string

2. **Check Atlas Cluster Status**

   - Make sure cluster is not paused
   - Cluster should show "Running" status

3. **Verify Database User**

   - Go to Atlas → Database Access
   - Make sure your database user exists and has proper permissions

4. **Test Connection String**
   - In Atlas, click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Update your .env with the exact string (replace `<password>` with actual password)

## Security Best Practices

- **For Production:** Only whitelist specific IP addresses
- **For Development:** Use `0.0.0.0/0` temporarily, but remove before production
- **Use Strong Passwords:** Make sure your database user has a strong password
- **Enable 2FA:** Enable two-factor authentication on your Atlas account













