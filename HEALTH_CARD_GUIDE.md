# NITC Health Card System - User Guide

## Overview

The NITC Health Card System allows NITC users to have a digital health card with a QR code. Staff, doctors, and administrators can scan this QR code to view patient details instantly.

## Features

### For NITC Users (nitcian role)

1. **Health Card Generation**: Each user gets a unique health card ID upon registration
2. **QR Code Display**: Your health card includes a QR code that contains your health information
3. **Edit Health Details**: You can update your health information including:
   - Roll Number
   - Date of Birth
   - Blood Group
   - Gender
   - Phone Number
   - Emergency Contact Information
   - Allergies
   - Current Medications
   - Medical History

### For Staff, Doctors, and Admins

1. **QR Code Scanner**: Scan patient QR codes using your device camera
2. **View Patient Details**: Instantly view all patient health information after scanning
3. **Manual Entry**: Option to manually enter QR code data if scanning fails

## How to Use

### As a NITC User

1. **Access Your Health Card**:

   - Login to your account
   - In the dashboard, click "View Health Card" button
   - Or navigate to `/health-card` route

2. **Update Your Health Information**:

   - Click the "Edit Health Card" button
   - Fill in your health details
   - Click "Save Changes"
   - Your changes will be saved immediately

3. **View Your QR Code**:
   - Your QR code is displayed on your health card
   - You can save this as an image or screenshot
   - Show this QR code at the health center

### As Staff/Doctor/Admin

1. **Access QR Scanner**:

   - Login to your portal (Staff, Doctor, or Admin)
   - The QR scanner is available on your dashboard

2. **Scan Patient QR Code**:

   - Click "Start Scanning" button
   - Allow camera permissions
   - Point camera at patient's QR code
   - Patient details will appear automatically

3. **Manual Entry** (Alternative):
   - If scanning fails, use the manual input field
   - Paste the QR code data
   - Click "Scan Manual Input"

## API Endpoints

### Backend Endpoints

#### Update Health Card

- **Endpoint**: `PUT /api/health/update`
- **Auth**: Required (JWT token)
- **Body**:
  ```json
  {
    "rollNo": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "bloodGroup": "string",
    "gender": "string",
    "phoneNumber": "string",
    "emergencyContact": "string",
    "emergencyPhone": "string",
    "allergies": "string",
    "medications": "string",
    "medicalHistory": "string"
  }
  ```

#### Get Health Card

- **Endpoint**: `GET /api/health/card`
- **Auth**: Required (JWT token)
- **Response**: User health card data with QR code image

#### Scan QR Code

- **Endpoint**: `POST /api/health/scan`
- **Auth**: Required (JWT token) - Staff, Doctor, or Admin only
- **Body**:
  ```json
  {
    "qrData": "string"
  }
  ```
- **Response**: Patient details

#### Get Patient by Health Card ID

- **Endpoint**: `GET /api/health/patient/:cardId`
- **Auth**: Required (JWT token) - Staff, Doctor, or Admin only
- **Response**: Patient details

## Technical Details

### Frontend

- **QR Code Generation**: Uses `qrcode.react` library
- **QR Code Scanning**: Uses `html5-qrcode` library
- **Libraries**:
  - `qrcode.react`: For generating QR codes
  - `html5-qrcode`: For scanning QR codes

### Backend

- **QR Code Generation**: Uses `qrcode` library
- **Health Card ID Format**: `NITC-HC-XXXXXXXX` (8 random hex characters)
- **QR Code Data**: JSON containing health card ID, user ID, name, email, and roll number

## Database Schema

The User model now includes:

- `rollNo`: String
- `dateOfBirth`: Date
- `bloodGroup`: String
- `gender`: Enum [Male, Female, Other]
- `phoneNumber`: String
- `emergencyContact`: String
- `emergencyPhone`: String
- `allergies`: String
- `medications`: String
- `medicalHistory`: String
- `healthCardId`: String (unique)

## Security Features

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Role-based access control (only staff/doctor/admin can scan)
3. **QR Code Data**: Contains only essential patient identification
4. **Protected Routes**: Frontend routes are protected by role

## File Structure

### Backend

```
backend/
├── controllers/
│   ├── authController.js (updated)
│   └── healthCardController.js (new)
├── middleware/
│   └── auth.js (new)
├── models/
│   └── User.js (updated)
├── routes/
│   ├── auth.js
│   └── healthCard.js (new)
└── server.js (updated)
```

### Frontend

```
frontend/src/
├── components/
│   ├── ProtectedRoute.jsx (updated)
│   └── QRScanner.jsx (new)
├── pages/
│   ├── HealthCard.jsx (new)
│   ├── HealthDashboard.jsx (updated)
│   ├── StaffPortal.jsx (updated)
│   ├── DoctorPortal.jsx (updated)
│   └── AdminPortal.jsx (updated)
├── styles/
│   └── HealthCard.css (new)
└── App.js (updated)
```

## Installation

### Backend

```bash
cd backend
npm install qrcode
```

### Frontend

```bash
cd frontend
npm install qrcode.react html5-qrcode
```