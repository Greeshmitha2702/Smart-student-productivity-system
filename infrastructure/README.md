# Infrastructure - Smart Student Productivity System

AWS CDK v2 (TypeScript) stack for serverless backend: Lambda, API Gateway, DynamoDB, Cognito.

## Overview

Single CDK stack (`ApiStack`) that deploys:
- **API Gateway** with Cognito User Pool authorizer
- **Lambda** unified handler for `/tasks`, `/planner`, `/analytics` routes
- **DynamoDB** single-table design (userId partition key, taskId sort key)
- **Cognito User Pool** with auto-confirm pre-sign-up trigger
- **S3** for frontend hosting + **CloudFront** CDN (optional)

## Prerequisites

- AWS CLI configured with credentials (role must have CloudFormation, Lambda, API Gateway, DynamoDB, Cognito, IAM permissions)
- Node.js 16+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`
- Docker (for Lambda build steps)

## File Structure

```
infrastructure/
├── src/
│   ├── stacks/
│   │   └── ApiStack.ts        # Main CDK stack definition
│   ├── lambdas/
│   │   ├── task.ts            # Unified REST handler for /tasks, /planner, /analytics
│   │   └── auth.ts            # Pre-sign-up auto-confirm Lambda
│   └── app.ts                 # CDK app entry point
├── cdk.json                   # CDK config (context, output filename)
├── .env.example               # Environment variables template
└── package.json
```

## Configuration

### 1. Create `.env` file

```bash
cp .env.example .env
```

Update with your values:

```env
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
CDK_DEFAULT_REGION=us-east-1
CDK_DEFAULT_ACCOUNT=123456789012
PROJECT_NAME=SmartStudentProductivity
ENVIRONMENT=dev
```

### 2. Bootstrap CDK (first time only)

```bash
npx cdk bootstrap
```

This creates S3 bucket and IAM roles for CDK deployments in your AWS account.

## Deployment

### Deploy All Stacks

```bash
npm install
npx cdk deploy --all --require-approval never
```

This will:
1. Create Cognito User Pool + pre-sign-up Lambda
2. Create DynamoDB table (userId, taskId, type, completed, priority, recurrence, etc.)
3. Create Lambda function for REST handler
4. Create API Gateway with routes + Cognito authorizer
5. Output API Gateway endpoint URL

### Verify Deployment

```bash
npx cdk deploy --all --outputs-file=outputs.json
cat outputs.json
```

Extract `ApiEndpoint` and `CognitoUserPoolId` for frontend configuration.

## API Gateway Routes

All routes require Cognito auth token + `userId` query parameter.

| Method | Route | Handler |
|--------|-------|---------|
| GET/POST/PUT/DELETE | `/tasks?userId={id}` | task.ts unified handler |
| GET/POST/PUT/DELETE | `/planner?userId={id}` | task.ts unified handler |
| GET/POST | `/analytics?userId={id}` | task.ts unified handler |

## Lambda Handler (`task.ts`)

Unified handler processes:

- **POST /tasks** → Store task item with type='task', priority field
- **GET /tasks** → Return user's tasks, search by title/priority, filter by date range
- **PUT /tasks** → Update task, compute completed status
- **DELETE /tasks** → Remove task

- **POST /planner** → Store plan item with type='plan', endTime/recurrence fields
- **GET /planner** → Return user's planner sessions, search by activity/recurrence
- **PUT /planner** → Update plan
- **DELETE /planner** → Remove plan

- **POST /analytics** → Create login item (type='login', taskId='login#YYYY-MM-DD')
- **GET /analytics** → Aggregate stats:
  - completedTasks: count of items where type='task' and completed=true
  - plannedActivities: count of items where type='plan'
  - productiveHours: sum of productiveHours across all items (tasks + plans)
  - streak: consecutive login days from today going backward
  - trend: last 14 days of productiveHours per day

## DynamoDB Schema

Single table, flexible item structure:

| Field | Type | Notes |
|-------|------|-------|
| userId | STRING (PK) | Cognito user ID (sub or username) |
| taskId | STRING (SK) | Epoch timestamp, UUID, or 'login#YYYY-MM-DD' |
| type | STRING | 'task' \| 'plan' \| 'login' |
| title / activity | STRING | Task title or planner activity name |
| date | STRING | ISO date (YYYY-MM-DD) |
| time | STRING | ISO time (HH:mm) |
| completed | BOOLEAN | Checkbox state |
| priority | STRING | 'low' \| 'medium' \| 'high' (tasks only) |
| endTime | STRING | ISO time (planner only) |
| recurrence | STRING | 'none' \| 'daily' \| 'weekly' (planner only) |
| productiveHours | NUMBER | Estimated or actual hours |
| createdAt | STRING | ISO timestamp |
| updatedAt | STRING | ISO timestamp |

## Monitoring & Logs

### CloudWatch Logs

Lambda logs available in CloudWatch:

```bash
aws logs tail /aws/lambda/TaskLambda --follow
```

### Debug Mode

Set environment variable `DEBUG=true` in Lambda to log request/response details.

## Cleanup

Remove all resources (caution: deletes DynamoDB table):

```bash
npx cdk destroy --all
```

Confirm deletion when prompted.

## Troubleshooting

### "Cognito User Pool not found"
- Ensure Cognito stack deployed successfully
- Check CloudFormation stack outputs

### "DynamoDB table does not exist"
- Ensure API Gateway has IAM permission to invoke Lambda
- Check Lambda IAM role has DynamoDB read/write permissions

### "401 Unauthorized"
- Verify Cognito token is valid
- Ensure Authorization header contains token from `getIdToken()` in Amplify

### Lambda timeout
- Default: 30 seconds. Increase in CDK stack if needed
- Check CloudWatch logs for slow queries

## Production Considerations

1. **DynamoDB:** Enable autoscaling or on-demand billing as traffic grows
2. **Lambda:** Consider concurrency limits, reserved concurrency
3. **API Gateway:** Enable API key + usage plans for rate limiting
4. **CloudFront:** Cache static assets, set proper TTLs
5. **Monitoring:** Set up CloudWatch alarms for error rates, latency
6. **Backup:** Enable DynamoDB point-in-time recovery (PITR)

---

See main `README.md` for full project overview.
