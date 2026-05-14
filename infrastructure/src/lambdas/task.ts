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

  const resource = event.resource; // '/planner' or '/tasks'
  const userId = event.queryStringParameters?.userId || 'demo-user';
  const claims = (event.requestContext as any)?.authorizer?.claims || {};
  const ownerEmail = claims.email || claims['cognito:username'] || claims.preferred_username || null;

  const toDayKey = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  function matchesFilter(item: any, q?: string, startDate?: string, endDate?: string) {
    if (!item) return false;
    if (q) {
      const ql = q.toLowerCase();
      const title = (item.title || item.activity || '').toString().toLowerCase();
      const priority = (item.priority || '').toString().toLowerCase();
      const recurrence = (item.recurrence || '').toString().toLowerCase();
      if (!title.includes(ql) && !priority.includes(ql) && !recurrence.includes(ql)) return false;
    }
    if (startDate) {
      const itemDate = item.date || item.createdAt || '';
      if (!itemDate) return false;
      if (new Date(itemDate) < new Date(startDate)) return false;
    }
    if (endDate) {
      const itemDate = item.date || item.createdAt || '';
      if (!itemDate) return false;
      if (new Date(itemDate) > new Date(endDate)) return false;
    }
    return true;
  }

  // Handle listing with optional filters for both resources
  if (event.httpMethod === 'GET' && (resource === '/planner' || resource === '/tasks')) {
    const q = event.queryStringParameters?.q;
    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;
    try {
      const result = await ddb.query({
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId }
      }).promise();

      const items = (result.Items || [])
        .filter(i => {
          if (resource === '/planner' && i.type !== 'plan') return false;
          if (resource === '/tasks' && i.type !== 'task') return false;
          return matchesFilter(i, q, startDate, endDate);
        })
        .map(i => ({ ...i, taskId: i.taskId, planId: i.type === 'plan' ? i.taskId : undefined }));

      if (resource === '/planner') return respond(200, { plans: items });
      return respond(200, { tasks: items });
    } catch (err) {
      console.error('Fetch items error:', err);
      return respond(500, { error: 'Failed to fetch items', details: err });
    }
  }

  if (resource === '/analytics' && event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (body.action !== 'recordLogin') return respond(400, { error: 'Invalid action' });

      const dayKey = new Date().toISOString().slice(0, 10);
      const taskId = `login#${dayKey}`;
      await ddb.put({
        TableName: tableName,
        Item: {
          userId,
          taskId,
          type: 'login',
          date: dayKey,
          createdAt: new Date().toISOString()
        }
      }).promise();

      return respond(200, { message: 'Login day recorded', day: dayKey });
    } catch (err) {
      console.error('Record login day error:', err);
      return respond(500, { error: 'Failed to record login day', details: err });
    }
  }

  if (resource === '/analytics' && event.httpMethod === 'GET') {
    try {
      const result = await ddb.query({
        TableName: tableName,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId }
      }).promise();

      const items = result.Items || [];
      const tasks = items.filter(i => i.type === 'task');
      const plans = items.filter(i => i.type === 'plan');
      const logins = items.filter(i => i.type === 'login');

      const completedTasks = tasks.filter(t => !!t.completed).length;
      const plannedActivities = plans.length;
      const productiveHoursTasks = tasks.reduce((s, t) => s + (Number((t as any).productiveHours) || 0), 0);
      const productiveHoursPlans = plans.reduce((s, p) => s + (Number((p as any).productiveHours) || 0), 0);
      const productiveHours = Math.round((productiveHoursTasks + productiveHoursPlans) * 100) / 100;

      const loginDays = new Set<string>();
      logins.forEach((l: any) => {
        const day = toDayKey(l.date || l.createdAt);
        if (day) loginDays.add(day);
      });

      let streak = 0;
      const cursor = new Date();
      while (true) {
        const key = cursor.toISOString().slice(0, 10);
        if (loginDays.has(key)) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      }

      const trendMap: Record<string, number> = {};
      [...tasks, ...plans].forEach((i: any) => {
        const day = toDayKey(i.date || i.completedAt || i.createdAt);
        if (!day) return;
        trendMap[day] = (trendMap[day] || 0) + (Number(i.productiveHours) || 0);
      });

      const trend = Object.keys(trendMap)
        .sort()
        .slice(-14)
        .map(day => ({ day, hours: Math.round(trendMap[day] * 100) / 100 }));

      return respond(200, {
        stats: {
          completedTasks,
          plannedActivities,
          productiveHours,
          streak
        },
        trend
      });
    } catch (err) {
      console.error('Fetch analytics error:', err);
      return respond(500, { error: 'Failed to fetch analytics', details: err });
    }
  }

  // Create
  if (event.httpMethod === 'POST' && (resource === '/planner' || resource === '/tasks')) {
    const body = JSON.parse(event.body || '{}');
    const providedId = body.planId || body.taskId;
    const taskId = providedId || Date.now().toString();
    const title = body.title || body.activity || '';
    const date = body.date || null;
    const time = body.time || null;
    const productiveHours = Number(body.productiveHours || 0);
    const priority = body.priority || null;
    const endTime = body.endTime || null;
    const recurrence = body.recurrence || null;
    const reminderMinutes = body.reminderMinutes !== undefined ? Number(body.reminderMinutes) : null;
    const completed = !!body.completed;
    const type = resource === '/planner' ? 'plan' : 'task';
    const createdAt = new Date().toISOString();
    const completedAt = completed ? new Date().toISOString() : null;

    const item: any = { userId, taskId, title, date, time, productiveHours, type, createdAt, completed };
    if (ownerEmail) item.ownerEmail = ownerEmail;
    if (priority) item.priority = priority;
    if (endTime) item.endTime = endTime;
    if (recurrence) item.recurrence = recurrence;
    if (reminderMinutes !== null && !isNaN(reminderMinutes)) item.reminderMinutes = reminderMinutes;
    if (completedAt) item.completedAt = completedAt;

    try {
      await ddb.put({ TableName: tableName, Item: item }).promise();
      const payload = type === 'plan' ? { plan: { ...item, planId: item.taskId } } : { task: item };
      return respond(201, payload);
    } catch (err) {
      console.error('Create item error:', err);
      return respond(500, { error: 'Failed to create item', details: err });
    }
  }

  // Update
  if (event.httpMethod === 'PUT' && (resource === '/planner' || resource === '/tasks')) {
    const body = JSON.parse(event.body || '{}');
    const taskId = body.planId || body.taskId;
    if (!taskId) return respond(400, { error: 'taskId/planId is required' });
    const title = body.title || body.activity;
    const date = body.date;
    const time = body.time;
    const productiveHours = body.productiveHours !== undefined ? Number(body.productiveHours) : undefined;
    const priority = body.priority;
    const endTime = body.endTime;
    const recurrence = body.recurrence;
    const reminderMinutes = body.reminderMinutes;
    const completed = body.completed;

    const updates: string[] = [];
    const exprVals: any = {};
    const exprNames: Record<string, string> = {};
    const setField = (field: string, valueToken: string, value: any) => {
      const nameToken = `#${field}`;
      exprNames[nameToken] = field;
      updates.push(`${nameToken} = ${valueToken}`);
      exprVals[valueToken] = value;
    };

    if (title !== undefined) { setField('title', ':title', title); }
    if (date !== undefined) { setField('date', ':date', date); }
    if (time !== undefined) { setField('time', ':time', time); }
    if (productiveHours !== undefined) { setField('productiveHours', ':ph', productiveHours); }
    if (priority !== undefined) { setField('priority', ':priority', priority); }
    if (endTime !== undefined) { setField('endTime', ':endTime', endTime); }
    if (recurrence !== undefined) { setField('recurrence', ':recurrence', recurrence); }
    if (reminderMinutes !== undefined) { setField('reminderMinutes', ':reminderMinutes', Number(reminderMinutes)); }
    if (completed !== undefined) {
      setField('completed', ':completed', !!completed);
      if (completed) {
        setField('completedAt', ':completedAt', new Date().toISOString());
      } else {
        setField('completedAt', ':null', null);
      }
    }

    if (updates.length === 0) return respond(400, { error: 'No updatable fields provided' });

    try {
      await ddb.update({
        TableName: tableName,
        Key: { userId, taskId },
        UpdateExpression: 'set ' + updates.join(', '),
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprVals
      }).promise();
      return respond(200, { message: 'Item updated' });
    } catch (err) {
      console.error('Update item error:', err);
      return respond(500, { error: 'Failed to update item', details: err });
    }
  }

  // Delete
  if (event.httpMethod === 'DELETE' && (resource === '/planner' || resource === '/tasks')) {
    const body = JSON.parse(event.body || '{}');
    const taskId = body.planId || body.taskId;
    if (!taskId) return respond(400, { error: 'taskId/planId is required' });
    try {
      await ddb.delete({ TableName: tableName, Key: { userId, taskId } }).promise();
      return respond(200, { message: 'Item deleted' });
    } catch (err) {
      console.error('Delete item error:', err);
      return respond(500, { error: 'Failed to delete item', details: err });
    }
  }

  return respond(405, 'Method Not Allowed');
}
