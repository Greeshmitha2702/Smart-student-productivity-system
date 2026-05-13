import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';

export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Example: Alarm for Lambda errors
    new Alarm(this, 'LambdaErrorAlarm', {
      metric: new Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm if Lambda function errors > 0 in 5 minutes',
    });
  }
}
