# NITC Health Centre Management System

A comprehensive health management system for NIT Calicut with automated email-based verification for NITCians.

## Features

### NITCian Registration & Email Verification

- **Registration**: Any NITCian can register using their NITC email ID (`@nitc.ac.in`)
- **Email Verification**: After registration, users receive a verification email at their NITC email address
- **Secure Access**: Users must verify their email before logging into the system
- **Role-based Access**: System supports multiple user roles:
  - **NITCian**: Students and staff of NITC
  - **Admin**: System administrators
  - **Doctor**: Medical practitioners
  - **Staff**: Clinic staff

### Key Features

- ✅ NITC email-based authentication
- ✅ Email verification system
- ✅ Secure JWT-based authentication
- ✅ Role-based access control
- ✅ Modern, responsive UI
- ✅ MongoDB database
- ✅ RESTful API

## Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Nodemailer** for email services
- **bcryptjs** for password hashing

### Frontend

- **React.js** with React Router
- **Tailwind CSS** for styling
- **Boxicons** for icons

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- NITC email account for SMTP configuration

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/nitc-hcms

# Server Port
PORT=5000

# JWT Secret (Use a secure random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-noreply-nihms@gmail.com
SMTP_PASS=your_app_specific_password

# Email Sender
EMAIL_FROM=noreply-nihms@gmail.com
```

4. Start the backend server:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Create an app password for "Mail"
3. Use this password in `SMTP_PASS` in your `.env` file

### Alternative Email Providers

For production, consider using:

- SendGrid
- AWS SES
- Mailgun

## User Flow

### NITCian Registration

1. Navigate to the login page
2. Click "Sign Up" to register
3. Enter:
   - Name
   - NITC Email (must end with `@nitc.ac.in`)
   - Password
4. Submit the form
5. Check your NITC email for verification link
6. Click the verification link
7. You will be redirected to the login page
8. Login with your credentials
9. Access your dashboard

### Login Process

1. Navigate to the login page
2. Enter your NITC email and password
3. System redirects based on role:
   - **NITCian**: `/user` dashboard
   - **Doctor**: `/doctor` dashboard
   - **Staff**: `/staff` dashboard
   - **Admin**: `/admin` dashboard

## API Endpoints

### Authentication

- `POST /api/register` - Register a new NITCian

  ```json
  {
    "name": "John Doe",
    "email": "john@nitc.ac.in",
    "password": "securePassword123"
  }
  ```

- `POST /api/login` - Login user

  ```json
  {
    "email": "john@nitc.ac.in",
    "password": "securePassword123"
  }
  ```

- `GET /api/verify/:token` - Verify email with token

## Database Schema

### User Model

```javascript
{
  name: String,
  email: String (unique, required),
  passwordHash: String (required),
  verified: Boolean (default: false),
  verificationToken: String,
  role: String (enum: ["nitcian", "staff", "doctor", "admin"]),
  createdAt: Date
}
```

## Security Features

- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ JWT token-based authentication
- ✅ Email verification requirement
- ✅ NITC email domain validation
- ✅ Secure HTTP cookies for token storage (optional)
- ✅ Role-based route protection

## Project Structure

```
ssl_pjt/
├── frontend/                       # Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx  # Route protection
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Login/Register page
│   │   │   ├── VerifyEmail.jsx   # Email verification page
│   │   │   ├── HealthDashboard.jsx # NITCian dashboard
│   │   │   ├── DoctorPortal.jsx    # Doctor dashboard
│   │   │   ├── StaffPortal.jsx     # Staff dashboard
│   │   │   └── AdminPortal.jsx     # Admin dashboard
│   │   └── App.js                  # Main router
│   └── public/
├── backend/                        # Backend (Node.js)
│   ├── controllers/
│   │   └── authController.js       # Auth logic
│   ├── models/
│   │   └── User.js                 # User schema
│   ├── routes/
│   │   └── auth.js                 # Auth routes
│   └── server.js                   # Server entry
└── README.md                       # This file
```

## Development

### Backend Development

```bash
cd backend
npm run dev
```

### Frontend Development

```bash
cd frontend
npm start
```

## Testing

### Test Email Configuration

Use the provided `testEmail.js` to test your SMTP configuration:

```bash
cd backend
node testEmail.js
```

## Troubleshooting

### Email Not Sending

1. Verify SMTP credentials in `.env`
2. Check Gmail app password is correct
3. Ensure SMTP port is not blocked by firewall

### MongoDB Connection Issues

1. Ensure MongoDB is running
2. Verify MONGO_URI in `.env`
3. Check network connectivity

### Frontend Not Connecting to Backend

1. Verify backend is running on port 5000
2. Check API_BASE URL in frontend components
3. Ensure CORS is enabled in backend

## License

MIT License - See LICENSE file for details

## Authors

- Initial implementation with NITC email verification system

## Support

For issues or questions, please contact the development team or submit an issue in the repository.

