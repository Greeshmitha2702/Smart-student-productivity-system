# Smart Student Productivity System

A full-stack AWS serverless application helping students manage tasks, planner sessions, and track daily productivity streaks with real-time analytics.

**IMPORTANT:** Do not commit secrets or generated AWS configuration files to this repo.

## Quick Start

1. **Copy environment templates** and fill with your values:

```bash
cp frontend/.env.example frontend/.env.local
cp infrastructure/.env.example infrastructure/.env
cp frontend/src/aws-exports.example.js frontend/src/aws-exports.js
```

2. **Deploy backend** (first time only):

```bash
cd infrastructure
npm install
npx cdk bootstrap
npx cdk deploy --all
```

3. **Run frontend locally**:

```bash
cd frontend
npm install
npm start
```

## Features

### Authentication
- **Sign Up:** Email + create password + confirm password (password must match)
- **Login:** Email + password  
- **Forgot Password:** Request reset code via email, then confirm new password
- **Auto-Verified Emails:** Cognito pre-signup auto-confirms accounts for demo

### Tasks vs Planner
**Tasks** are generic to-do items:
- Create/view/edit/delete with search
- Priority: Low / Medium / High
- Optional date, time, and productive hours estimate
- Checkbox to mark complete
- "Schedule" action: promote task to planner session

**Planner** is schedule-focused (calendar sessions):
- Create/view/edit/delete with search
- **Required:** Date + start time
- Optional end time and recurrence (None / Daily / Weekly)
- Productive hours estimate
- Checkbox to mark complete
- "Unschedule" action: demote back to task

### Analytics Dashboard
- **Real-Time Metrics:**
  - Completed Tasks: total count
  - Planned Activities: total planner sessions
  - Productive Hours: sum of all productive hours across tasks + planner
  - Streak (days): consecutive login days ending today
- **14-Day Trend Chart:** productive hours per day
- **Login Tracking:** recorded automatically on each login

### Home Page
- Daily motivational quote (changes per calendar day)
- Today's Summary: tasks due today, planned sessions today, today's productive hours, total completed tasks

## Tech Stack
- **Frontend:** React 18 + TypeScript, AWS Amplify
- **Backend:** AWS CDK v2 (TypeScript), Lambda, API Gateway, DynamoDB (single-table design)
- **Auth:** Cognito User Pool with pre-sign-up auto-confirm
- **Database:** DynamoDB (PK: userId, SK: taskId; supports tasks, plans, logins, analytics in one table)

## API Endpoints

All endpoints require Cognito auth token.

**GET/POST/PUT/DELETE `/tasks?userId={userId}`**
- List: GET with optional `q` (search title/priority), `startDate`, `endDate`
- Create: POST with `{ title, date?, time?, productiveHours?, priority? }`
- Update: PUT with `{ taskId, title?, completed?, date?, time?, productiveHours?, priority? }`
- Delete: DELETE with `{ taskId }`

**GET/POST/PUT/DELETE `/planner?userId={userId}`**
- List: GET with optional `q`, `startDate`, `endDate`
- Create: POST with `{ activity, date?, time?, endTime?, productiveHours?, recurrence? }`
- Update: PUT with `{ planId, activity?, completed?, date?, time?, endTime?, productiveHours?, recurrence? }`
- Delete: DELETE with `{ planId }`

**GET/POST `/analytics?userId={userId}`**
- GET: Returns real-time stats (completedTasks, plannedActivities, productiveHours, streak) and 14-day trend
- POST: `{ action: 'recordLogin' }` — records today's login for streak tracking

## Deployment

1. **Deploy infrastructure:**
   ```bash
   cd infrastructure
   npx cdk bootstrap
   npx cdk deploy --all --require-approval never
   ```

2. **Build & deploy frontend:**
   ```bash
   cd frontend
   npm run build
   ```

## Security

- Keep `.env.local`, `aws-exports.js`, `.env` out of Git
- Cognito enforces password matching in sign-up
- DynamoDB encryption at rest enabled
- API Gateway + Lambda use Cognito token authorization

---

See `frontend/README.md` and `infrastructure/README.md` for detailed setup instructions.
