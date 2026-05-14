import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaIntegration, RestApi, CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';

interface ApiStackProps extends StackProps {
  userPool: UserPool;
  table: Table;
  notificationTopic: Topic;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [props.userPool]
    });

    const api = new RestApi(this, 'StudentProductivityApi', {
      restApiName: 'Student Productivity Service',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

    // Example: Lambda for Task CRUD
    const taskLambda = new NodejsFunction(this, 'TaskLambda', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '..', '/lambdas/task.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: props.table.tableName,
        TOPIC_ARN: props.notificationTopic.topicArn
      },
      bundling: {
    nodeModules: [], // add any npm modules you use in your Lambda here
  }
    });
    props.table.grantReadWriteData(taskLambda);
    props.notificationTopic.grantPublish(taskLambda);

    const tasks = api.root.addResource('tasks');
    tasks.addMethod('GET', new LambdaIntegration(taskLambda), { authorizer });
    tasks.addMethod('POST', new LambdaIntegration(taskLambda), { authorizer });
    tasks.addMethod('PUT', new LambdaIntegration(taskLambda), { authorizer });
    tasks.addMethod('DELETE', new LambdaIntegration(taskLambda), { authorizer });

    const planner = api.root.addResource('planner');
    planner.addMethod('GET', new LambdaIntegration(taskLambda), { authorizer });
    planner.addMethod('POST', new LambdaIntegration(taskLambda), { authorizer });
    planner.addMethod('PUT', new LambdaIntegration(taskLambda), { authorizer });
    planner.addMethod('DELETE', new LambdaIntegration(taskLambda), { authorizer });

    const analytics = api.root.addResource('analytics');
    analytics.addMethod('GET', new LambdaIntegration(taskLambda), { authorizer });
    analytics.addMethod('POST', new LambdaIntegration(taskLambda), { authorizer });
  }
}
