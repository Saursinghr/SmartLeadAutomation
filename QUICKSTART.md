# Quick Start Guide

This guide will help you get the Smart Lead Automation System up and running in minutes.

## Prerequisites

- Node.js v18+ installed
- MongoDB installed locally OR MongoDB Atlas account
- npm v9+ installed

## Option 1: Local MongoDB

### Step 1: Start MongoDB
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# macOS/Linux
mongod --dbpath /path/to/your/data/directory
```

### Step 2: Start Backend
```bash
cd backend
npm install
npm run dev
```

Wait for:
```
✅ MongoDB Connected: localhost:27017 || production MongoDB URI
🚀 Server is running on port 5000
```

### Step 3: Start Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Wait for:
```
➜  Local:   http://localhost:5173/
```

### Step 4: Open Browser
Navigate to: http://localhost:5173

## Option 2: MongoDB Atlas (Cloud)

### Step 1: Get MongoDB Atlas URI
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Replace `<password>` with your database password

### Step 2: Configure Backend
```bash
cd backend
npm install

# Edit .env file and update MONGODB_URI
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-lead-automation
```

### Step 3: Start Backend
```bash
npm run dev
```

### Step 4: Start Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

### Step 5: Open Browser
Navigate to: http://localhost:5173

## Testing the Application

### 1. Process Your First Batch
1. In the input field, enter: `Peter, Aditi, Ravi, Satoshi`
2. Click "Process Batch"
3. Watch the table populate with results!

### 2. Explore Features
- **Filter**: Click "Verified" or "To Check" to filter results
- **Statistics**: View real-time stats at the top
- **Auto-refresh**: Table updates every 10 seconds
- **CRM Sync**: Check backend console after 5 minutes

### 3. Verify Business Logic
- Names with >60% confidence → Green "Verified" badge
- Names with ≤60% confidence → Yellow "To Check" badge

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists in backend folder
- Check port 5000 is not in use

### Frontend won't start
- Verify `.env` file exists in frontend folder
- Check port 5173 is not in use
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### API connection error
- Ensure backend is running on port 5000
- Check VITE_API_BASE_URL in frontend/.env
- Verify CORS_ORIGIN in backend/.env

## Next Steps

1. Read the [README.md](./README.md) for detailed documentation
2. Check [walkthrough.md](./.gemini/antigravity/brain/bbd1de2a-618a-4ed2-bdfb-be3ceda4d776/walkthrough.md) for testing guide
3. Deploy to production (see README.md deployment section)

## Sample Test Data

Try these names to see different results:
- **High Confidence**: Peter, Emma, John, Maria, Hans
- **Medium Confidence**: Aditi, Ravi, Yuki, Chen
- **Low Confidence**: Unique, Custom, Test

Enjoy! 🚀
