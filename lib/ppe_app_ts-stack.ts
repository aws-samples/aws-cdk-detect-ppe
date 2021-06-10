import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as sns from "@aws-cdk/aws-sns";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as s3n from '@aws-cdk/aws-s3-notifications';
import * as path from 'path';
import * as subs from '@aws-cdk/aws-sns-subscriptions';




interface PpeAppStackProps extends cdk.StackProps {
  snsEmailNotification: string;
  DETECTFACECOVER: boolean;
  DETECTHEADCOVER: boolean;
  DETECTHANDCOVER: boolean;
}



export class PpeAppTsStack extends cdk.Stack {
  public readonly snsTopic: sns.Topic;
  constructor(scope: cdk.Construct, id: string, props: PpeAppStackProps) {
    super(scope, id, props);

    //Create the bucket for storing image
    const inputbucket = new s3.Bucket(this, 'ImageInputBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });
    
    //Create Dynamodb Table
    const dynamodbtable = new dynamodb.Table(this,'resulttable',{
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      }
    });

    //Create SNS topic and and email subscription
    this.snsTopic = new sns.Topic(this,'SNSNotification' ,{
      displayName: 'PPE Voilations Topic'
    });
    this.snsTopic.addSubscription(new subs.EmailSubscription(props.snsEmailNotification));

    //Create lambda function and add environment variables
    const processImage = new lambda.Function(this,'ProcessImage',{
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'processimage.handler',
      code: lambda.Code.fromAsset(path.join('./lambda'))
    })
    processImage.addEnvironment('TABLE_NAME',dynamodbtable.tableName);
    processImage.addEnvironment('SNS_TOPIC',this.snsTopic.topicArn);
    processImage.addEnvironment('FACECOVER',props.DETECTFACECOVER.toString());
    processImage.addEnvironment('HEADCOVER',props.DETECTHEADCOVER.toString());
    processImage.addEnvironment('HANDCOVER',props.DETECTHANDCOVER.toString());

    
    
    // Add event subscription for s3
    inputbucket.addEventNotification(s3.EventType.OBJECT_CREATED,new s3n.LambdaDestination(processImage));

    //Manage IAM permissions
    inputbucket.grantRead(processImage);
    dynamodbtable.grantWriteData(processImage);
    this.snsTopic.grantPublish(processImage); 
    processImage.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRekognitionReadOnlyAccess"))
    /*
    processImage.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rekognition:*'],
      resources: ['*']
    }))
    */

  }
}
