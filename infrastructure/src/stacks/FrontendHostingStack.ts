import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Distribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

export class FrontendHostingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteBucket = new Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    // Create Origin Access Identity for CloudFront to access S3
    const oai = new OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for CloudFront to access S3 bucket'
    });

    // Grant OAI read permissions on the bucket
    siteBucket.grantRead(oai);

    // Create CloudFront distribution
    new Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: new S3Origin(siteBucket, { originAccessIdentity: oai })
      },
      defaultRootObject: 'index.html'
    });
  }
}
