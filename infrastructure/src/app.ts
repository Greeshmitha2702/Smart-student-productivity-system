import { App } from 'aws-cdk-lib';
import { AuthStack } from './stacks/AuthStack';
import { ApiStack } from './stacks/ApiStack';
import { DatabaseStack } from './stacks/DatabaseStack';
import { NotificationStack } from './stacks/NotificationStack';
import { MonitoringStack } from './stacks/MonitoringStack';
import { FrontendHostingStack } from './stacks/FrontendHostingStack';

const app = new App();

const authStack = new AuthStack(app, 'AuthStack');
const dbStack = new DatabaseStack(app, 'DatabaseStack');
const notificationStack = new NotificationStack(app, 'NotificationStack', {
  table: dbStack.table
});
const monitoringStack = new MonitoringStack(app, 'MonitoringStack');
const apiStack = new ApiStack(app, 'ApiStack', {
  userPool: authStack.userPool,
  table: dbStack.table,
  notificationTopic: notificationStack.topic
});
new FrontendHostingStack(app, 'FrontendHostingStack');
