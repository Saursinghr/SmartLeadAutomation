# Smart Lead Automation System

> **VR Automations - Developer Test Assignment**

A production-level full-stack application that automates lead enrichment using AI-powered nationality prediction. Built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring modern architecture, beautiful UI, and robust background processing.

![Tech Stack](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🌟 Features

### Phase 1: Input & Processing
- **Batch Input**: Accept multiple names (comma-separated or array)
- **Real-time Processing**: Asynchronous API calls with progress feedback
- **Smart Validation**: Input validation and error handling

### Phase 2: Enrichment & Logic
- **API Integration**: Nationalize.io API for nationality prediction
- **Efficient Processing**: Parallel batch processing with `Promise.all`
- **Business Rules**: 
  - Probability > 60% → Status: "Verified"
  - Probability ≤ 60% → Status: "To Check"
- **Data Persistence**: MongoDB with indexed fields for performance

### Phase 3: Automation & Sync
- **Background Jobs**: Scheduled CRM sync every 5 minutes using `node-cron`
- **Idempotency**: Database flags prevent duplicate syncs
- **Console Logging**: `[CRM Sync] Sending verified lead {Name} to Sales Team...`

### UI/UX Excellence
- **Modern Dark Theme**: Beautiful glassmorphism and gradient effects
- **Real-time Updates**: Auto-refresh every 10 seconds
- **Advanced Filtering**: Filter by status (All/Verified/To Check)
- **Statistics Dashboard**: Live metrics and KPIs
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Fade-in, slide-in, and hover effects

## 📁 Project Structure

```
assignment-saurabh/
├── backend/                      # Node.js/Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       # MongoDB connection with retry logic
│   │   ├── controllers/
│   │   │   └── lead.controller.js # Request handlers
│   │   ├── jobs/
│   │   │   └── crmSync.job.js    # Background CRM sync scheduler
│   │   ├── middleware/
│   │   │   ├── errorHandler.js   # Global error handling
│   │   │   └── validateRequest.js # Input validation
│   │   ├── models/
│   │   │   └── Lead.model.js     # Mongoose schema with indexes
│   │   ├── routes/
│   │   │   └── lead.routes.js    # API routes
│   │   ├── services/
│   │   │   ├── lead.service.js   # Business logic
│   │   │   └── nationalize.service.js # API integration
│   │   ├── utils/
│   │   │   └── logger.js         # Custom logging utility
│   │   └── server.js             # Express app entry point
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── .gitignore
│   └── package.json
│
├── frontend/                     # React/Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI components
│   │   │   │   ├── badge.jsx
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   └── table.jsx
│   │   │   ├── Dashboard.jsx     # Main dashboard layout
│   │   │   ├── LeadInputForm.jsx # Batch input form
│   │   │   ├── LeadsTable.jsx    # Results table with filtering
│   │   │   └── StatsCards.jsx    # Statistics display
│   │   ├── lib/
│   │   │   └── utils.js          # Utility functions
│   │   ├── services/
│   │   │   └── api.js            # Axios API client
│   │   ├── store/
│   │   │   └── leadStore.js      # Zustand state management
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md                     # This file
```

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd assignment-saurabh
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update values
cp .env.example .env

# Update .env with your MongoDB URI:
# MONGODB_URI=mongodb://localhost:27017/smart-lead-automation
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smart-lead-automation

# Start the backend server
npm run dev
# Server will run on http://localhost:5000
```

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env
cp .env.example .env

# The default API URL is already set to http://localhost:5000
# Update if your backend runs on a different port

# Start the development server
npm run dev
# Frontend will run on http://localhost:5173
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🏗️ Architecture Explanation

### Batch API Request Handling

**Challenge**: Process multiple names efficiently without blocking or timing out.

**Solution**: Parallel Processing with `Promise.all`

```javascript
// In nationalize.service.js
async predictBatch(names) {
  // Process all names in parallel using Promise.all
  const predictions = await Promise.all(
    names.map(name => this.predictNationality(name))
  );
  return predictions;
}
```

**Why This Works**:
1. **Concurrency**: All API requests are fired simultaneously
2. **Non-blocking**: Node.js event loop handles multiple requests efficiently
3. **Error Resilience**: Individual failures don't crash the entire batch
4. **Performance**: Dramatically faster than sequential processing

**Alternative Considered**: Rate limiting with queue (p-limit)
- Not needed as Nationalize.io handles concurrent requests well
- Would add complexity without significant benefit for this use case

### Preventing Duplicate CRM Syncs (Idempotency)

**Challenge**: Ensure leads are never synced more than once, even with multiple job executions.

**Solution**: Database-Level Idempotency Flags

```javascript
// In Lead.model.js
const leadSchema = new mongoose.Schema({
  syncedToCRM: {
    type: Boolean,
    default: false,
    index: true  // Indexed for fast queries
  },
  syncedAt: {
    type: Date,
    default: null
  }
});

// Static method to get only unsynced leads
leadSchema.statics.getLeadsForSync = function() {
  return this.find({
    status: 'Verified',
    syncedToCRM: false  // Only get leads that haven't been synced
  });
};
```

**How It Works**:
1. **Query Filter**: Background job only fetches leads where `syncedToCRM === false`
2. **Atomic Update**: After successful sync, `markAsSynced()` sets flag to `true`
3. **Timestamp**: `syncedAt` provides audit trail
4. **Index**: Database index on `syncedToCRM` ensures fast queries

**Additional Safety Measures**:
- **Concurrency Lock**: `isRunning` flag prevents overlapping executions
- **Transaction Safety**: Each lead is marked individually to prevent partial failures
- **Error Handling**: Failed syncs don't update the flag, allowing retry

### Database Schema Design

**Optimizations**:
- **Compound Index**: `{ status: 1, syncedToCRM: 1 }` for CRM sync queries
- **Timestamp Index**: `{ createdAt: -1 }` for sorting
- **Validation**: Schema-level validation ensures data integrity
- **Virtuals**: `confidenceScore` computed on-the-fly

## 📊 API Endpoints

### POST `/api/leads/process`
Process a batch of names for nationality prediction.

**Request Body**:
```json
{
  "names": ["Peter", "Aditi", "Ravi", "Satoshi"]
}
// OR
{
  "names": "Peter, Aditi, Ravi, Satoshi"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully processed 4 leads",
  "data": {
    "batchId": "uuid-here",
    "totalProcessed": 4,
    "stats": {
      "verified": 3,
      "toCheck": 1,
      "averageConfidence": 75
    },
    "leads": [...]
  }
}
```

### GET `/api/leads`
Get all leads with optional filtering.

**Query Parameters**:
- `status`: Filter by status ("Verified" or "To Check")
- `batchId`: Filter by batch ID
- `syncedToCRM`: Filter by sync status (true/false)

**Response**:
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "name": "Peter",
      "country": "US",
      "countryName": "United States",
      "probability": 0.85,
      "status": "Verified",
      "syncedToCRM": false,
      "createdAt": "2024-01-09T..."
    }
  ]
}
```

### GET `/api/leads/stats`
Get statistics about all leads.

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "verified": 75,
    "toCheck": 25,
    "synced": 50,
    "pending": 25
  }
}
```

### GET `/api/leads/:id`
Get a single lead by ID.

### DELETE `/api/leads`
Delete all leads (development only).

## 🎨 Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Scheduling**: node-cron
- **HTTP Client**: Axios
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Performance**: Compression middleware

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Inter)

## 🔧 Development Scripts

### Backend
```bash
npm run dev      # Start with auto-reload
npm start        # Production start
```

### Frontend
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## 📸 Database Screenshot

After running the application and processing some leads, your MongoDB database will look like this:

**Leads Collection**:
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Peter",
  "country": "US",
  "countryName": "United States",
  "probability": 0.85,
  "status": "Verified",
  "syncedToCRM": true,
  "syncedAt": "2024-01-09T10:30:00.000Z",
  "batchId": "uuid-here",
  "createdAt": "2024-01-09T10:25:00.000Z",
  "updatedAt": "2024-01-09T10:30:00.000Z"
}
```

**Indexes**:
- `{ status: 1, syncedToCRM: 1 }` - Compound index for CRM sync
- `{ createdAt: -1 }` - For sorting
- `{ batchId: 1 }` - For batch tracking

## 🚀 Deployment Guide

### Backend Deployment (Railway/Render/Heroku)

1. **MongoDB Atlas Setup**:
   - Create a free cluster at mongodb.com/cloud/atlas
   - Get connection string
   - Update `MONGODB_URI` in environment variables

2. **Deploy to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

3. **Environment Variables**:
   Set these in your hosting platform:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-atlas-uri>`
   - `PORT=5000`
   - `CORS_ORIGIN=<your-frontend-url>`

### Frontend Deployment (Vercel/Netlify)

1. **Build Configuration**:
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Environment Variables**:
   - `VITE_API_BASE_URL=<your-backend-url>`

3. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🧪 Testing the Application

### Manual Testing Steps

1. **Process a Batch**:
   - Enter: "Peter, Aditi, Ravi, Satoshi"
   - Click "Process Batch"
   - Verify leads appear in table

2. **Check Business Logic**:
   - Verify high confidence (>60%) leads show "Verified"
   - Verify low confidence (≤60%) leads show "To Check"

3. **Test Filtering**:
   - Click "Verified" filter
   - Click "To Check" filter
   - Click "All" to reset

4. **Monitor CRM Sync**:
   - Wait 5 minutes
   - Check backend console for sync logs
   - Verify "Synced" badge appears in table
   - Confirm leads are not synced again

5. **Real-time Updates**:
   - Process new batch
   - Watch table auto-update
   - Check statistics update

## 📝 Assignment Requirements Checklist

- ✅ **Phase 1: Input**
  - ✅ Dashboard interface
  - ✅ Batch name input (comma-separated)
  - ✅ Submit to backend
  - ✅ Live results table
  - ✅ Filter by status

- ✅ **Phase 2: Backend Logic**
  - ✅ POST endpoint for batch processing
  - ✅ Nationalize.io API integration
  - ✅ Efficient batch handling (Promise.all)
  - ✅ Business rules (>60% = Verified)
  - ✅ MongoDB persistence

- ✅ **Phase 3: Automation**
  - ✅ Scheduled job (every 5 minutes)
  - ✅ Identify verified leads
  - ✅ Console logging for CRM sync
  - ✅ Idempotency guarantee

- ✅ **Code Quality**
  - ✅ Clean MVC architecture
  - ✅ Separation of concerns
  - ✅ Error handling
  - ✅ Input validation

- ✅ **UI/UX**
  - ✅ Functional interface
  - ✅ Modern, attractive design
  - ✅ Responsive layout

## 🎯 Key Highlights

1. **Production-Ready**: Industrial-level folder structure and code organization
2. **Modern Stack**: Latest versions of React, Vite, TailwindCSS
3. **Beautiful UI**: Dark theme with glassmorphism and smooth animations
4. **Efficient Processing**: Parallel API calls with Promise.all
5. **Robust Idempotency**: Database-level flags prevent duplicate syncs
6. **Real-time Updates**: Auto-refresh with React Query
7. **Comprehensive Logging**: Custom logger with colored output
8. **Error Handling**: Global error middleware and validation
9. **Scalable Architecture**: Clean separation of concerns
10. **Developer Experience**: Hot reload, TypeScript support, path aliases

## 📧 Contact

For questions or issues, please contact the developer.

---

**Built with ❤️ for VR Automations Developer Test**
#   S m a r t L e a d A u t o m a t i o n  
 