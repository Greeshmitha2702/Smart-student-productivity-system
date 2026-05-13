import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB, SNS } from 'aws-sdk';

const tableName = process.env.TABLE_NAME!;
const topicArn = process.env.TOPIC_ARN!;
const ddb = new DynamoDB.DocumentClient();
const sns = new SNS();

function respond(statusCode: number, body: any) {
  let responseBody: any = body;
  if (body && typeof body === 'object') {
    const copy: any = { ...body };
    if (copy.details) {
      const d = copy.details;
      if (d instanceof Error) {
        copy.details = { message: d.message, stack: d.stack };
      } else {
        try {
          copy.details = JSON.parse(JSON.stringify(d));
        } catch (e) {
          copy.details = String(d);
        }
      }
    }
    responseBody = copy;
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
    },
    body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle CORS preflight requests (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, '');
  }

  // Planner CRUD endpoints
  if (event.resource === '/planner') {
    const userId = event.queryStringParameters?.userId || 'demo-user';
    switch (event.httpMethod) {
      case 'GET': {
        try {
          const result = await ddb.query({
            TableName: tableName,
            KeyConditionExpression: 'userId = :uid',
            ExpressionAttributeValues: { ':uid': userId }
          }).promise();
          // Only return items with type 'plan'
          const plans = (result.Items || []).filter(i => i.type === 'plan').map(item => ({
            ...item,
            planId: item.taskId
          }));
          return respond(200, { plans });
        } catch (err) {
          console.error('Fetch plans error:', err);
          return respond(500, { error: 'Failed to fetch plans', details: err });
        }
      }
      case 'POST': {
        const body = JSON.parse(event.body || '{}');
        const taskId = body.planId || Date.now().toString();
        const time = body.time || '';
        const activity = body.activity || '';
        const item = { userId, taskId, time, activity, type: 'plan' };
        try {
          await ddb.put({ TableName: tableName, Item: item }).promise();
          return respond(201, { plan: { ...item, planId: item.taskId } });
        } catch (err) {
          console.error('Create plan error:', err);
          return respond(500, { error: 'Failed to create plan', details: err });
        }
      }
      case 'PUT': {
        const body = JSON.parse(event.body || '{}');
        const taskId = body.planId;
        if (!taskId) {
          return respond(400, { error: 'planId is required' });
        }
        try {
          await ddb.update({
            TableName: tableName,
            Key: { userId, taskId },
            UpdateExpression: 'set time = :time, activity = :activity',
            ExpressionAttributeValues: {
              ':time': body.time,
              ':activity': body.activity
            }
          }).promise();
          return respond(200, { message: 'Plan updated' });
        } catch (err) {
          return respond(500, { error: 'Failed to update plan', details: err });
        }
      }
      case 'DELETE': {
        const body = JSON.parse(event.body || '{}');
        const taskId = body.planId;
        if (!taskId) {
          return respond(400, { error: 'planId is required' });
        }
        try {
          await ddb.delete({ TableName: tableName, Key: { userId, taskId } }).promise();
          return respond(200, { message: 'Plan deleted' });
        } catch (err) {
          console.error('Delete plan error:', err);
          return respond(500, { error: 'Failed to delete plan', details: err });
        }
      }
      default:
        return respond(405, 'Method Not Allowed');
    }
  }

  // Task CRUD endpoints
  switch (event.httpMethod) {
    case 'GET': {
      // Fetch all tasks for the user from DynamoDB
      // For demo, get userId from a query param or use a placeholder
      const userId = event.queryStringParameters?.userId || 'demo-user';
      try {
        const result = await ddb.query({
          TableName: tableName,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId }
        }).promise();
        return respond(200, { tasks: result.Items || [] });
      } catch (err) {
        return respond(500, { error: 'Failed to fetch tasks', details: err });
      }
    }
    case 'POST': {
      // Create a new task
      const userId = event.queryStringParameters?.userId || 'demo-user';
      const body = JSON.parse(event.body || '{}');
      const taskId = body.taskId || Date.now().toString();
      const title = body.title || '';
      const completed = !!body.completed;
      const item = { userId, taskId, title, completed };
      try {
        await ddb.put({ TableName: tableName, Item: item }).promise();
        return respond(201, { task: item });
      } catch (err) {
        console.error('Create task error:', err);
        return respond(500, { error: 'Failed to create task', details: err });
      }
    }
    case 'PUT': {
      // Update an existing task
      const userId = event.queryStringParameters?.userId || 'demo-user';
      const body = JSON.parse(event.body || '{}');
      const taskId = body.taskId;
      if (!taskId) {
        return respond(400, { error: 'taskId is required' });
      }
      try {
        await ddb.update({
          TableName: tableName,
          Key: { userId, taskId },
          UpdateExpression: 'set title = :title, completed = :completed',
          ExpressionAttributeValues: {
            ':title': body.title,
            ':completed': !!body.completed
          }
        }).promise();
        return respond(200, { message: 'Task updated' });
      } catch (err) {
        console.error('Update task error:', err);
        return respond(500, { error: 'Failed to update task', details: err });
      }
    }
    case 'DELETE': {
      // Delete a task
      const userId = event.queryStringParameters?.userId || 'demo-user';
      const body = JSON.parse(event.body || '{}');
      const taskId = body.taskId;
      if (!taskId) {
        return respond(400, { error: 'taskId is required' });
      }
      try {
        await ddb.delete({ TableName: tableName, Key: { userId, taskId } }).promise();
        return respond(200, { message: 'Task deleted' });
      } catch (err) {
        console.error('Delete task error:', err);
        return respond(500, { error: 'Failed to delete task', details: err });
      }
    }
    default:
      return respond(405, 'Method Not Allowed');
  }
};
