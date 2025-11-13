# MongoDB Connection Error - Troubleshooting Guide

## Common Error Messages and Solutions

### 1. "MONGO_URI is not defined"

**Problem:** The `.env` file is missing or doesn't contain `MONGO_URI`

**Solution:**

1. Create a `.env` file in `backend/` directory (if it doesn't exist)
2. Add the following line:

```env
MONGO_URI=mongodb://localhost:27017/nitc-hcms
```

Or for MongoDB Atlas:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms
```

### 2. "Authentication failed"

**Problem:** Wrong username or password in the connection string

**Solution:**

- For MongoDB Atlas: Check your Atlas username and password
- Make sure password doesn't contain special characters that need URL encoding (like `@`, `#`, `/`, etc.)
- If password has special characters, URL encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `/` becomes `%2F`

### 3. "Connection refused" or "ECONNREFUSED"

**Problem:** MongoDB server is not running or not accessible

**Solution:**

- **For Local MongoDB:**
  - Windows: Check if MongoDB service is running
    ```powershell
    Get-Service MongoDB
    ```
  - Start MongoDB service:
    ```powershell
    Start-Service MongoDB
    ```
  - Or manually start: `mongod --dbpath "C:\data\db"`
- **For MongoDB Atlas:**
  - Check if your IP address is whitelisted in Atlas Network Access
  - Go to Atlas → Network Access → Add IP Address or use `0.0.0.0/0` for development

### 4. "ENOTFOUND" or DNS errors

**Problem:** Invalid connection string format or hostname

**Solution:**

- Verify your MONGO_URI format is correct:
  - Local: `mongodb://localhost:27017/nitc-hcms`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/nitc-hcms`
- Make sure there are no spaces in the connection string
- Check if the cluster name is correct (for Atlas)

### 5. "Connection timeout"

**Problem:** Network issues or firewall blocking connection

**Solution:**

- Check your internet connection
- Disable VPN temporarily
- Check firewall settings
- For Atlas: Verify IP whitelist includes your current IP

### 6. "Server selection timed out"

**Problem:** Cannot reach MongoDB servers

**Solution:**

- Increase timeout in server.js (already set to 5s)
- Check network connectivity
- Verify MongoDB Atlas cluster is running (not paused)

## Quick Diagnostic Steps

### Step 1: Verify .env file exists and has correct format

```powershell
# Windows PowerShell
cd backend
type .env
```

Should see:

```
MONGO_URI=mongodb://localhost:27017/nitc-hcms
PORT=5000
JWT_SECRET=your_secret_key
...
```

### Step 2: Test MongoDB Connection

**For Local MongoDB:**

```powershell
# Check if MongoDB is running
netstat -ano | findstr :27017
```

**For MongoDB Atlas:**

- Go to Atlas dashboard
- Click "Connect" on your cluster
- Test connection string

### Step 3: Test Connection String Format

Your MONGO_URI should look like one of these:

**Local MongoDB:**

```
mongodb://localhost:27017/nitc-hcms
```

**MongoDB Atlas:**

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nitc-hcms?retryWrites=true&w=majority
```

### Step 4: Check Server Logs

When you start the server with:

```powershell
cd backend
node server.js
```

Look for:

- ✅ `MongoDB Connected Successfully` - Connection working
- ❌ `MongoDB Connection Error:` - Check the specific error message

## Common Fixes

### Fix 1: Create/Update .env File

1. Navigate to `backend/` directory
2. Create `.env` file (if it doesn't exist)
3. Add:

```env
# Local MongoDB (if MongoDB is installed locally)
MONGO_URI=mongodb://localhost:27017/nitc-hcms

# OR MongoDB Atlas (cloud)
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/nitc-hcms

PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
```

### Fix 2: Install/Start Local MongoDB

If you want to use local MongoDB:

1. **Install MongoDB:**

   - Download from: https://www.mongodb.com/try/download/community
   - Follow installation instructions
   - Create data directory: `C:\data\db`

2. **Start MongoDB:**

   ```powershell
   # Windows Service (if installed as service)
   Start-Service MongoDB

   # Or manually
   mongod --dbpath "C:\data\db"
   ```

### Fix 3: Setup MongoDB Atlas (Recommended for Development)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Add your IP to Network Access (or use `0.0.0.0/0` for development)
5. Get connection string
6. Update `.env` with the connection string

## Still Having Issues?

1. **Check the exact error message** in the server console
2. **Verify .env file location** - Must be in `backend/` directory
3. **Restart the server** after making changes to `.env`
4. **Check MongoDB version compatibility** - Mongoose works with MongoDB 4.4+

## Example Working .env File

```env
# Database
MONGO_URI=mongodb://localhost:27017/nitc-hcms

# Server
PORT=5000

# JWT Authentication
JWT_SECRET=4a8d1f1b6e13d09abef2a88c9c2c8717f85bd2e9

# Email (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply-nihms@gmail.com
```

**Note:** Never commit `.env` file to git! It contains sensitive information.













