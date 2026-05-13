import { BundlingOptions } from 'aws-cdk-lib/aws-lambda-nodejs';
declare module 'aws-cdk-lib/aws-lambda-nodejs' {
  interface BundlingOptions {
    forceDocker?: boolean;
  }
}
