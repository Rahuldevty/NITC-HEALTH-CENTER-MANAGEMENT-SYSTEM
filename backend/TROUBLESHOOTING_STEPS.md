# MongoDB Connection Troubleshooting - Step by Step

## Issues Found:

1. ✅ Connection string missing database name (FIXED)
2. ⚠️ IP address not whitelisted in MongoDB Atlas

## Current Connection String:

```
MONGO_URI=mongodb+srv://rahulm251216cs_db_user:MNmz0R1ldfTuz6bm@cluster0.4vfrdgv.mongodb.net/nitc-hcms
```

## CRITICAL: Fix IP Whitelist Issue

### Step 1: Go to MongoDB Atlas Network Access

1. Visit: https://cloud.mongodb.com/
2. Sign in to your account
3. Select your cluster: `cluster0.4vfrdgv`
4. Click **"Network Access"** in the left sidebar

### Step 2: Check Current IP Whitelist

- Look at the list of IP addresses
- Your current IP: `14.139.185.115`
- Check if this IP exists in the list

### Step 3: Add Your IP Address

**Option A: Add Specific IP (Recommended)**

1. Click **"Add IP Address"** button
2. Click **"Add Current IP Address"** (auto-detects your IP)
3. Or manually enter: `14.139.185.115`
4. Click **"Confirm"**
5. Wait for status to change from "Pending" to "Active" (1-3 minutes)

**Option B: Allow All IPs (Quick Fix for Development)**

1. Click **"Add IP Address"**
2. Enter: `0.0.0.0/0`
3. Add comment: "Development - Allow all IPs"
4. Click **"Confirm"**
5. Wait 1-3 minutes

⚠️ **IMPORTANT:** After adding IP, wait 2-3 minutes before testing!

### Step 4: Verify Database User

1. Go to **"Database Access"** in left sidebar
2. Verify user `rahulm251216cs_db_user` exists
3. Check user has "Read and write to any database" permission

### Step 5: Test Connection

After waiting 2-3 minutes, run:

```powershell
cd backend
node test-mongo-connection.js
```

Expected output:

```
✅ SUCCESS! MongoDB Connected
   Database: nitc-hcms
   Host: cluster0.4vfrdgv.mongodb.net
```

## Common Mistakes:

1. **Not Waiting Long Enough**: Atlas takes 1-3 minutes to activate IP changes
2. **Wrong IP Address**: Your IP might have changed (check with: https://www.whatismyip.com/)
3. **Typo in IP**: Double-check the IP address you entered
4. **Status Still Pending**: Wait until status shows "Active" (green checkmark)

## Alternative: Check if Cluster is Paused

1. Go to Atlas → Clusters
2. Make sure cluster shows "Running" status (not "Paused")
3. If paused, click "Resume" and wait a few minutes

## Still Not Working?

### Verify Connection String Format:

```
✅ CORRECT:
mongodb+srv://username:password@cluster0.4vfrdgv.mongodb.net/nitc-hcms

❌ WRONG:
mongodb+srv://username:password@cluster0.4vfrdgv.mongodb.net/  (missing db name)
mongodb+srv://username:password@cluster0.4vfrdgv.mongodb.net   (missing slash)
```

### Test with mongo shell (if installed):

```powershell
mongosh "mongodb+srv://cluster0.4vfrdgv.mongodb.net/nitc-hcms" --username rahulm251216cs_db_user
```

Enter password when prompted: `MNmz0R1ldfTuz6bm`

## Quick Checklist:

- [ ] Connection string includes database name: `/nitc-hcms`
- [ ] IP address added to Network Access whitelist
- [ ] IP whitelist status shows "Active" (not "Pending")
- [ ] Waited 2-3 minutes after adding IP
- [ ] Database user exists and has correct permissions
- [ ] Cluster is running (not paused)
- [ ] Internet connection is working
- [ ] No VPN blocking connection













