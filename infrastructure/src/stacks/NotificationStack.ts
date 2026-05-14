import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { join } from 'path';

interface NotificationStackProps extends StackProps {
  table: Table;
}

export class NotificationStack extends Stack {
  public readonly topic: Topic;

  constructor(scope: Construct, id: string, props: NotificationStackProps) {
    super(scope, id, props);

    this.topic = new Topic(this, 'TaskNotificationTopic', {
      displayName: 'Task Notification Topic'
    });

    const reminderLambda = new NodejsFunction(this, 'ReminderLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '..', '/lambdas/reminders.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: props.table.tableName,
        DEFAULT_REMINDER_MINUTES: '15',
        WINDOW_MINUTES: '5',
        SENDER_EMAIL: 'bingumallagreeshmitha@gmail.com'
      },
      bundling: {
        nodeModules: []
      }
    });

    props.table.grantReadWriteData(reminderLambda);
    
    reminderLambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail'],
      resources: ['*']
    }));

    new Rule(this, 'ReminderScheduleRule', {
      schedule: Schedule.rate(Duration.minutes(5))
    }).addTarget(new LambdaFunction(reminderLambda));
  }
}
