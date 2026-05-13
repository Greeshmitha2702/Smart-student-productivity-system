# Frontend - Smart Student Productivity System

React 18 + TypeScript web application with AWS Amplify authentication and API integration.

## Setup

### 1. Prerequisites
- Node.js 16+ and npm
- AWS account with Cognito User Pool configured
- Valid `aws-exports.js` file (see template)

### 2. Environment Variables

Create `frontend/.env.local`:

```env
VITE_API_ENDPOINT=https://your-api-gateway-url/api
```

### 3. AWS Configuration

Copy and update `aws-exports.js`:

```bash
cp src/aws-exports.example.js src/aws-exports.js
```

Fill in your Cognito User Pool ID, Client ID, and API Gateway endpoint.

### 4. Install & Run

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── api/
│   ├── user.ts          # getCurrentUserId() from Cognito
│   ├── tasks.ts         # Task CRUD API wrapper
│   ├── planner.ts       # Planner CRUD API wrapper
│   └── analytics.ts     # Analytics & login tracking
├── components/
│   ├── AuthWrapper.tsx  # Sign-up, login, forgot password flows
│   └── Card.tsx         # Reusable card UI component
├── pages/
│   ├── Home.tsx         # Daily quotes + summary widgets
│   ├── Tasks.tsx        # Task management with priority
│   ├── Planner.tsx      # Calendar sessions with recurrence
│   ├── Analytics.tsx    # Real-time productivity dashboard
│   └── NotFound.tsx
├── types/
│   └── index.ts         # Type definitions (Task, Plan, Analytics)
├── App.tsx              # Main app with routing
└── main.tsx             # React entry point
```

## Key Features

### Authentication (AuthWrapper)
- Sign-up: Email + password + confirm password validation
- Login: Email + password
- Forgot Password: Email → verification code → new password
- Auto login recording for daily streak tracking

### Tasks Page
- **Create:** Title, date, time, priority (Low/Medium/High), productive hours
- **Read:** List with search by title/priority, filter by date range
- **Update:** Edit any field, mark complete
- **Delete:** With confirmation
- **Promote:** Schedule task → creates planner session, deletes task

### Planner Page
- **Create:** Activity, date (required), time (required), end time, recurrence, productive hours
- **Read:** List with search by activity/recurrence, filter by date range
- **Update:** Edit any field, mark complete
- **Delete:** With confirmation
- **Demote:** Unschedule → creates task, deletes plan

### Analytics
- **Real-Time Stats:** Completed tasks, planned activities, productive hours, consecutive login days
- **Trend Chart:** 14-day productivity hours history
- **Login Tracking:** Auto-recorded POST to `/analytics` on each login

### Home Page
- Rotating daily quote (changes each calendar day)
- Today's tasks, plans, productivity hours (real-time)
- Total completed tasks across all time

## API Integration

### User Module (`api/user.ts`)
```typescript
const userId = await getCurrentUserId(); // Returns Cognito user ID
```

### Task API Wrapper (`api/tasks.ts`)
```typescript
const tasks = await fetchTasks({ 
  q: 'search', 
  startDate, 
  endDate, 
  priority: 'high' 
});
await createTask({ title, date, time, priority, productiveHours });
await updateTask({ taskId, title, completed, priority, ... });
await deleteTask(taskId);
```

### Planner API Wrapper (`api/planner.ts`)
```typescript
const plans = await fetchPlans({ q: 'search', startDate, endDate, recurrence: 'daily' });
await createPlan({ activity, date, time, endTime, recurrence, productiveHours });
await updatePlan({ planId, activity, completed, endTime, recurrence, ... });
await deletePlan(planId);
```

### Analytics API (`api/analytics.ts`)
```typescript
const { stats, trend } = await fetchAnalytics(); // Real-time metrics + 14-day trend
await recordDailyLogin(); // Non-blocking POST (called after login)
```

## Build & Deployment

```bash
npm run build
```

Outputs to `dist/` folder. Deploy to S3 bucket created by infrastructure CDK stack.

## TypeScript Types

See `src/types/index.ts` for:
- `Task` with optional `priority` field
- `Plan` with optional `endTime` and `recurrence` fields
- `Analytics` with `stats` and `trend` arrays
- Union types: `TaskPriority = 'low' | 'medium' | 'high'`, `PlanRecurrence = 'none' | 'daily' | 'weekly'`

## Security Notes

- `aws-exports.js` is Git-ignored; never commit actual credentials
- Cognito tokens injected via `authHeaders()` utility in API calls
- Password confirmation enforced in sign-up form
- All API calls require `userId` query parameter (extracted from Cognito)
