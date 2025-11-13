# Debug Guide - Registration Issues

## Quick Diagnostics

### 1. Check if Backend is Running

```powershell
# Check if server is running on port 5000
netstat -ano | findstr :5000
```

**Expected Output:**

```
TCP    0.0.0.0:5000    LISTENING
```

If not running, start it:

```powershell
cd backend
node server.js
```

### 2. Check Database Connection

**Issue:** Your `.env` file has `<db_password>` placeholder which needs to be replaced with your actual MongoDB password.

**Fix:**

1. Open `backend/.env`
2. Replace `<db_password>` with your actual MongoDB Atlas password
3. Ensure the MONGO_URI is properly formatted

**Correct format:**

```env
MONGO_URI=mongodb+srv://username:ACTUAL_PASSWORD@cluster0.4vfrdgv.mongodb.net/nitc-hcms
```

### 3. Test Backend Endpoint

```powershell
# Test if backend is responding
Invoke-WebRequest -Uri "http://localhost:5000/api/register" -Method POST -ContentType "application/json" -Body '{"name":"Test","email":"test@nitc.ac.in","password":"Test123"}'
```

Or use a tool like Postman or your browser console.

### 4. Check Browser Console

1. Open your React app (http://localhost:3000)
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Try to register
5. Check the failed request and see the error message

### 5. Check Server Logs

Look at the terminal where you started the backend. Common errors:

**MongoDB Connection Error:**

```
❌ MongoDB connection error: ...
```

**Solution:** Fix the MONGO_URI in `.env`

**Email Error:**

```
Email sending failed: ...
```

**Solution:** This is okay - registration should still work and return verification link

### 6. Test Registration with Postman

1. Open Postman
2. POST to `http://localhost:5000/api/register`
3. Set Headers: `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "name": "Test User",
  "email": "test@nitc.ac.in",
  "password": "TestPassword123"
}
```

**Expected Response:**

```json
{
  "message": "Registration successful! Please check your NITC email to verify your account.",
  "verificationLink": "http://localhost:3000/verify/<token>"
}
```

### 7. Common Issues and Solutions

#### Issue: "Cannot connect to MongoDB"

- **Cause:** Wrong MONGO_URI or IP not whitelisted in MongoDB Atlas
- **Solution:**
  1. Check `.env` MONGO_URI
  2. In MongoDB Atlas → Network Access → Add your IP (or 0.0.0.0/0 for development)

#### Issue: "Registration failed" without specific error

- **Cause:** Network error or backend not responding
- **Solution:**
  1. Check if backend is running: `netstat -ano | findstr :5000`
  2. Check browser console for CORS errors
  3. Verify API_BASE in Login.jsx is correct: `http://localhost:5000/api`

#### Issue: "Email already registered"

- **Cause:** User already exists
- **Solution:** Try different email or delete user from database

#### Issue: "Invalid NITC email"

- **Cause:** Email doesn't end with @nitc.ac.in
- **Solution:** Use valid NITC email format

### 8. Quick Test Script

Create a file `test-registration.js` in `backend`:

```javascript
const fetch = require("node-fetch");

async function testRegistration() {
  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@nitc.ac.in",
        password: "TestPassword123",
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testRegistration();
```

Run it: `node test-registration.js`

## Step-by-Step Registration Test

1. **Start Backend:**

   ```powershell
   cd backend
   node server.js
   ```

   Should see: `✅ MongoDB Connected` and `🚀 Server running on port 5000`

2. **Start Frontend:**

   ```powershell
   cd frontend
   npm start
   ```

3. **Open Browser:** http://localhost:3000

4. **Register a user:**

   - Click "Sign Up"
   - Name: Test User
   - Email: test@nitc.ac.in
   - Password: Test123
   - Submit

5. **Check Result:**
   - Should see success message
   - Copy verification link from alert (if email not configured)
   - Open verification link in browser
   - Should see "Email verified successfully"
   - Go back and login

## Database Access

If you need to manually verify or delete users:

1. Connect to MongoDB Atlas
2. Go to your cluster → Browse Collections
3. Find the `users` collection
4. You can view/delete users here

Or use MongoDB Compass:

1. Download MongoDB Compass
2. Connect with: `mongodb+srv://username:password@cluster0.4vfrdgv.mongodb.net`
3. Browse your database

## Still Having Issues?

1. **Check all environment variables in `.env`:**

   ```powershell
   type backend\.env
   ```

2. **Verify MongoDB is accessible:**

   ```powershell
   # Try connecting with mongo shell
   mongo "mongodb+srv://cluster0.4vfrdgv.mongodb.net/nitc-hcms" --username your_username
   ```

3. **Check for any error logs in backend terminal**

4. **Try restarting both backend and frontend**

## Working Environment Variables

Your current `.env` needs:

```env
PORT=5000
MONGO_URI=mongodb+srv://rahulm251216cs_db_user:PASSWORD@cluster0.4vfrdgv.mongodb.net/nitc-hcms
JWT_SECRET=4a8d1f1b6e13d09abef2a88c9c2c8717f85bd2e9
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rahuldevty@gmail.com
SMTP_PASS=rrcq xemg unsm xxow
EMAIL_FROM="NITC Health Centre <no-reply@nitc.ac.in>"
```

**Replace PASSWORD with your actual MongoDB Atlas password**

