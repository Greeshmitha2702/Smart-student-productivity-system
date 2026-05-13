# Smart Student Productivity System

This repository contains a React + AWS CDK project. DO NOT commit any secrets or generated AWS configuration files.

Quick start

1. Copy environment templates and fill values:

```bash
cp frontend/.env.example frontend/.env.local
cp infrastructure/.env.example infrastructure/.env
cp frontend/src/aws-exports.example.js frontend/src/aws-exports.js
```

2. Install dependencies and run locally:

```bash
cd frontend
npm install
npm start

cd ../infrastructure
npx cdk bootstrap
npx cdk deploy --all
```

Secrets & CI

- Keep secrets out of the repo. Use GitHub Secrets / AWS Secrets Manager / SSM Parameter Store for CI and production.
- If you accidentally committed secrets, remove them from the repo history with a history-rewrite tool (BFG or git-filter-repo).

Files to edit with real values:
- `frontend/src/aws-exports.js` (ignored in repo; use the example file)
- `frontend/.env.local` (local frontend env vars)
- `infrastructure/.env` (CDK/local infra overrides)
# Smart Student Productivity System

A full-stack AWS serverless application to help students manage tasks, deadlines, and productivity, demonstrating Amazon Leadership Principles and modern AWS architecture.

## Tech Stack
- **Frontend:** React (TypeScript)
- **Backend:** AWS CDK (TypeScript), Lambda, API Gateway, Cognito, DynamoDB, EventBridge, SNS, CloudWatch, X-Ray, IAM, S3, CloudFront
- **Testing:** Jest
- **CI/CD:** GitHub Actions

## Features
- User authentication (Cognito)
- Task CRUD (Lambda per resource)
- Priority prediction, deadline tracking
- Energy level selection, daily planner
- Productivity analytics dashboard
- Scheduled reminders (EventBridge)
- Email notifications (SNS)
- AI-generated task ordering
- Monitoring & alarms (CloudWatch, X-Ray)

## AWS Services Used
| Purpose                | AWS Service         |
|------------------------|--------------------|
| Frontend hosting       | S3 + CloudFront    |
| Backend APIs           | API Gateway        |
| Compute                | Lambda             |
| Database               | DynamoDB           |
| Authentication         | Cognito            |
| Scheduling             | EventBridge        |
| Notifications          | SNS                |
| Monitoring             | CloudWatch, X-Ray  |
| IAM/Security           | IAM                |

## How to Run
1. Install AWS CLI, CDK, Node.js, and Yarn/NPM.
2. Bootstrap CDK: `cdk bootstrap` in `infrastructure/`.
3. Deploy backend: `cdk deploy` in `infrastructure/`.
4. Start frontend: `yarn install && yarn start` in `frontend/`.
5. Configure AWS credentials with permissions for all listed services.

## Permissions Needed
- Ability to create/manage: CloudFormation, IAM, Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront, EventBridge, SNS, CloudWatch, X-Ray.

## Decision-Making & Tradeoffs
- DynamoDB chosen for serverless scalability and fast development.
- Each Lambda handles one resource’s CRUD for separation of concerns.
- Cognito secures APIs and user auth.
- Event-driven reminders for scalability.
- S3 + CloudFront for global frontend delivery.

## Leadership Principles Demonstrated
- Customer Obsession, Ownership, Invent and Simplify, Think Big, Bias for Action, Dive Deep, etc.

---
See code and comments for more details on architecture and tradeoffs.