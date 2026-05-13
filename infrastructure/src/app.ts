import { App } from 'aws-cdk-lib';
import { AuthStack } from './stacks/AuthStack';
import { ApiStack } from './stacks/ApiStack';
import { DatabaseStack } from './stacks/DatabaseStack';
import { NotificationStack } from './stacks/NotificationStack';
import { MonitoringStack } from './stacks/MonitoringStack';
import { FrontendHostingStack } from './stacks/FrontendHostingStack';

import { v4 as uuidv4 } from 'uuid';

const app = new App();
const uuid = uuidv4();

const authStack = new AuthStack(app, `AuthStack-${uuid}`);
const dbStack = new DatabaseStack(app, `DatabaseStack-${uuid}`);
const notificationStack = new NotificationStack(app, `NotificationStack-${uuid}`);
const monitoringStack = new MonitoringStack(app, `MonitoringStack-${uuid}`);
const apiStack = new ApiStack(app, `ApiStack-${uuid}`, {
  userPool: authStack.userPool,
  table: dbStack.table,
  notificationTopic: notificationStack.topic
});
new FrontendHostingStack(app, `FrontendHostingStack-${uuid}`);
