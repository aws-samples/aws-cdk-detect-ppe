import * as cdk from "@aws-cdk/core";
import * as sns from "@aws-cdk/aws-sns";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as path from "path";
import { SnsEventSource } from "@aws-cdk/aws-lambda-event-sources";

interface TranslatorStackProps extends cdk.StackProps {
  snsTopic: Array<sns.Topic>;
  translateTo: string;
}

export class TranslatorStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: TranslatorStackProps) {
    super(scope, id, props);

    //Create Dynamodb Table
    const translatortable = new dynamodb.Table(this, "translatortable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
    });
    var count = 0;
    props.snsTopic.forEach((snstopic) => {
      count++;
      const translatorfunction = new lambda.Function(this, "Translator"+count, {
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: "translator.handler",
        code: lambda.Code.fromAsset(path.join("./lambda")),
      });
      translatorfunction.addEnvironment("TABLE_NAME", translatortable.tableName);
      translatorfunction.addEnvironment("TRANSLATE_TO", props.translateTo);
      translatortable.grantWriteData(translatorfunction);
      translatorfunction.addEventSource(new SnsEventSource(snstopic));
      translatorfunction.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('TranslateReadOnly'))

    });

    
  }
}
