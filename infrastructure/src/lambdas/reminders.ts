import { DynamoDB, SES } from 'aws-sdk';

const tableName = process.env.TABLE_NAME!;
const defaultReminderMinutes = Number(process.env.DEFAULT_REMINDER_MINUTES || 15);
const windowMinutes = Number(process.env.WINDOW_MINUTES || 5);
const defaultTimezoneOffsetMinutes = Number(process.env.DEFAULT_TIMEZONE_OFFSET_MINUTES || -330);
const senderEmail = process.env.SENDER_EMAIL || 'noreply@studentproductivity.app';

const ddb = new DynamoDB.DocumentClient();
const ses = new SES({ region: 'us-east-1' });

function parseScheduledDate(date?: string | null, time?: string | null, timezoneOffsetMinutes?: number | null) {
  if (!date) return null;

  const normalizedTime = time || '09:00';
  const effectiveTimezoneOffsetMinutes = timezoneOffsetMinutes === undefined || timezoneOffsetMinutes === null
    ? defaultTimezoneOffsetMinutes
    : Number(timezoneOffsetMinutes);

  const scheduled = new Date(Date.UTC(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)) - 1,
        Number(date.slice(8, 10)),
        Number(normalizedTime.slice(0, 2)),
        Number(normalizedTime.slice(3, 5))
      ) + (effectiveTimezoneOffsetMinutes * 60 * 1000));
  if (!isNaN(scheduled.getTime())) {
    return scheduled;
  }

  const fallback = new Date(date);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

async function scanAllItems() {
  const items: any[] = [];
  let exclusiveStartKey: DynamoDB.DocumentClient.Key | undefined;

  do {
    const result = await ddb.scan({
      TableName: tableName,
      ExclusiveStartKey: exclusiveStartKey
    }).promise();

    items.push(...(result.Items || []));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

export const handler = async () => {
  const now = Date.now();
  console.log(`[ReminderLambda] Starting scan at ${new Date(now).toISOString()}`);
  console.log(`[ReminderLambda] TABLE_NAME=${tableName}, SENDER_EMAIL=${senderEmail}`);
  
  const items = await scanAllItems();
  console.log(`[ReminderLambda] Scanned ${items.length} items`);
  let published = 0;

  for (const item of items) {
    if (!item || (item.type !== 'task' && item.type !== 'plan')) {
      console.log(`[ReminderLambda] Skipping item: invalid type=${item?.type}`);
      continue;
    }
    if (item.completed) {
      console.log(`[ReminderLambda] Skipping completed: ${item.taskId}`);
      continue;
    }

    const schedule = parseScheduledDate(item.date, item.time, item.timezoneOffsetMinutes);
    if (!schedule) {
      console.log(`[ReminderLambda] Skipping ${item.taskId}: could not parse date=${item.date} time=${item.time}`);
      continue;
    }

    const reminderMinutesValue = Number(item.reminderMinutes || defaultReminderMinutes);
    const notifyAt = schedule.getTime() - reminderMinutesValue * 60 * 1000;
    const key = `${item.taskId}:${item.date || ''}:${item.time || ''}:${reminderMinutesValue}`;

    console.log(`[ReminderLambda] Item ${item.taskId}: scheduled=${new Date(schedule).toISOString()}, notifyAt=${new Date(notifyAt).toISOString()}, now=${new Date(now).toISOString()}`);

    if (item.reminderSentKey === key) {
      console.log(`[ReminderLambda] Skipping ${item.taskId}: already sent`);
      continue;
    }
    
    const withinWindow = notifyAt <= now && notifyAt + windowMinutes * 60 * 1000 >= now;
    console.log(`[ReminderLambda] Item ${item.taskId}: notifyAt=${notifyAt}, now=${now}, withinWindow=${withinWindow} (window=${windowMinutes}min)`);
    
    if (!withinWindow) continue;

    const recipientEmail = item.ownerEmail;
    if (!recipientEmail) {
      console.log(`Skipping reminder for ${item.title || 'untitled'} - no ownerEmail found`);
      continue;
    }

    const subject = `${item.type === 'task' ? 'Task' : 'Plan'} reminder: ${item.title || item.activity || 'Upcoming item'}`;
    const messageLines = [
      `You have an upcoming ${item.type}!`,
      '',
      `Title: ${item.title || item.activity || 'Untitled item'}`,
      `Scheduled for: ${item.date || 'n/a'} at ${item.time || 'n/a'}`,
      '',
      `This reminder was sent ${reminderMinutesValue} minutes before the scheduled time.`,
      '',
      'Smart Student Productivity System'
    ].join('\n');

    try {
      console.log(`[ReminderLambda] Sending email to ${recipientEmail} for ${item.taskId}`);
      await ses.sendEmail({
        Source: senderEmail,
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
          Subject: { Data: subject.slice(0, 100), Charset: 'UTF-8' },
          Body: { Text: { Data: messageLines, Charset: 'UTF-8' } }
        }
      }).promise();
      console.log(`[ReminderLambda] ✓ Email sent to ${recipientEmail}`);
    } catch (error) {
      console.error(`[ReminderLambda] Failed to send email to ${recipientEmail}:`, error);
      continue;
    }

    try {
      await ddb.update({
        TableName: tableName,
        Key: {
          userId: item.userId,
          taskId: item.taskId
        },
        UpdateExpression: 'set reminderSentKey = :key, reminderSentAt = :sentAt',
        ExpressionAttributeValues: {
          ':key': key,
          ':sentAt': new Date().toISOString()
        }
      }).promise();
      console.log(`[ReminderLambda] ✓ Updated DynamoDB for ${item.taskId}`);
    } catch (error) {
      console.error(`[ReminderLambda] Failed to update DynamoDB for ${item.taskId}:`, error);
    }

    published += 1;
  }

  console.log(`[ReminderLambda] Complete: scanned=${items.length}, published=${published}`);
  return {
    statusCode: 200,
    body: JSON.stringify({
      scanned: items.length,
      published
    })
  };
};
