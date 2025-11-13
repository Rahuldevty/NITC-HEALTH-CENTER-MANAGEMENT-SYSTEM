# NITCian Registration and Email Verification - Setup Guide

## Overview

This guide explains how the NITC email-based registration and verification system works in the NITC Health Centre Management System.

## System Architecture

### User Registration Flow

```
1. User fills registration form (Name, NITC Email, Password)
   ↓
2. Frontend validates NITC email format (@nitc.ac.in)
   ↓
3. Backend validates email domain
   ↓
4. Backend creates user with:
   - Hashed password (bcrypt)
   - Verification token (crypto.randomBytes)
   - Role: "nitcian"
   - verified: false
   ↓
5. Backend sends verification email to user's NITC email
   ↓
6. User clicks verification link in email
   ↓
7. Frontend VerifyEmail component calls verification API
   ↓
8. Backend sets verified: true
   ↓
9. User can now login
```

## Key Components

### 1. Frontend - Registration Form (Login.jsx)

Location: `health/src/pages/Login.jsx`

**Features:**

- Registration form with Name, NITC Email, and Password fields
- Validates email ends with `@nitc.ac.in`
- Sends POST request to `/api/register`
- Shows success message prompting user to check email

```javascript
// Key Registration Handler
const handleRegister = async (e) => {
  e.preventDefault();
  const name = e.target.username.value;
  const email = e.target.email.value;
  const password = e.target.password.value;

  // Validate NITC email
  if (!email.endsWith("@nitc.ac.in")) {
    alert("Please use your NITC email (e.g., example@nitc.ac.in)");
    return;
  }

  // Send to backend
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
};
```

### 2. Backend - Registration Controller (authController.js)

Location: `backend/controllers/authController.js`

**Features:**

- Validates all fields are provided
- Validates NITC email format using regex
- Checks if email already exists
- Hashes password with bcrypt
- Generates unique verification token
- Creates user with role "nitcian"
- Sends verification email via Nodemailer
- Returns success message

```javascript
// Key Registration Logic
const nitcEmailRegex = /^[a-zA-Z0-9._%+-]+@nitc\.ac\.in$/i;
if (!nitcEmailRegex.test(email)) {
  return res.status(400).json({
    message: "Please register using a valid NITC email",
  });
}

const passwordHash = await bcrypt.hash(password, 10);
const verificationToken = crypto.randomBytes(24).toString("hex");

const user = new User({
  name,
  email,
  passwordHash,
  verified: false,
  verificationToken,
  role: "nitcian",
});
await user.save();
```

### 3. Email Verification - Backend (authController.js)

**Features:**

- Receives verification token from URL
- Finds user by token
- Sets verified: true
- Clears verification token
- Returns success message

```javascript
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.json({ message: "Email verified successfully! You can now log in." });
};
```

### 4. Email Verification - Frontend (VerifyEmail.jsx)

Location: `frontend/src/pages/VerifyEmail.jsx`

**Features:**

- Fetches verification endpoint on component mount
- Shows loading state
- Displays success/error message
- Redirects to login page on success

```javascript
useEffect(() => {
  const verifyUserEmail = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/verify/${token}`);
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("✅ Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err) {
      setStatus("error");
      setMessage("❌ An error occurred while verifying your email.");
    }
  };
  verifyUserEmail();
}, [token, navigate]);
```

### 5. Protected Routes (ProtectedRoute.jsx)

Location: `frontend/src/components/ProtectedRoute.jsx`

**Features:**

- Checks if user is logged in (has token)
- Checks if user has the required role
- Redirects unauthorized users to login

```javascript
export default function ProtectedRoute({ children, allowedRole }) {
  const userData = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userData);
    if (user.role !== allowedRole) {
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

### 6. Login Verification (authController.js)

**Important:** Users cannot login until their email is verified.

```javascript
if (!user.verified) {
  return res.status(403).json({
    message: "Email not verified. Please check your inbox.",
  });
}
```

## Email Template

The verification email sent to NITCians includes:

- Professional HTML design with NITC branding
- Welcome message with user's name
- Prominent verification button
- Fallback text link
- Instructions for what to do
- Information about the system

## Security Features

1. **NITC Email Validation**

   - Frontend: Checks email ends with `@nitc.ac.in`
   - Backend: Regex validation (`/^[a-zA-Z0-9._%+-]+@nitc\.ac\.in$/i`)

2. **Password Security**

   - Passwords are hashed with bcryptjs (10 rounds)
   - Never stored in plain text

3. **Verification Token**

   - Cryptographically secure random token (24 bytes)
   - One-time use
   - Cleared after successful verification

4. **Login Protection**

   - Users must verify email before login
   - JWT token required for all protected routes
   - Role-based access control

5. **Database Schema**
   ```javascript
   {
     email: { type: String, required: true, unique: true },
     verified: { type: Boolean, default: false },
     verificationToken: { type: String },
     role: { enum: ["nitcian", "staff", "doctor", "admin"] }
   }
   ```

## Configuration

### Environment Variables (.env)

Required for backend email functionality:

```env
MONGO_URI=mongodb://localhost:27017/nitc-hcms
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_specific_password
EMAIL_FROM=noreply-nihms@gmail.com
```

### Gmail Setup for SMTP

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Google Account → Security
   - 2-Step Verification → App passwords
   - Create password for "Mail"
3. Use the 16-character password in SMTP_PASS

## Testing the Registration Flow

### 1. Start Backend

```bash
cd backend
npm start
```

### 2. Start Frontend

```bash
cd frontend
npm start
```

### 3. Test Registration

1. Navigate to `http://localhost:3000`
2. Click "Sign Up"
3. Enter:
   - Name: John Doe
   - Email: john@nitc.ac.in
   - Password: SecurePass123
4. Submit form
5. Check email inbox
6. Click verification link
7. Should redirect to login page

### 4. Test Login

1. Enter registered email and password
2. Should log in and redirect to `/user` dashboard

### 5. Verify Unverified Users Cannot Login

1. Try to login with an unverified account
2. Should receive error: "Email not verified. Please check your inbox."

## Troubleshooting

### Email Not Sending

- Check SMTP credentials in `.env`
- Verify Gmail app password
- Test SMTP with `node testEmail.js`

### Email Link Broken

- Ensure verification link points to correct frontend URL
- Check token is properly generated and stored

### User Cannot Login After Verification

- Check if `verified` field is set to `true` in database
- Verify JWT token generation
- Check role assignment

### CORS Issues

- Ensure backend allows requests from frontend origin
- Check `app.use(cors())` in server.js

## Additional Features to Implement

Future enhancements could include:

1. **Resend Verification Email**

   - Add endpoint and UI for resending verification email
   - Limit resend attempts to prevent spam

2. **Token Expiration**

   - Add expiration time to verification tokens
   - Implement token refresh mechanism

3. **Password Reset**

   - Implement forgot password functionality
   - Send reset link via email

4. **Additional User Details**

   - Course, Year, Department
   - Phone number
   - Emergency contact

5. **Email Templates Customization**
   - Create separate email templates for different events
   - Add system branding and logo

## Support

For issues or questions:

- Check the main README.md
- Review console logs for errors
- Verify environment variables
- Test database connection

