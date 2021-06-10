# Welcome to the detect personal protective equipment workshop source code

This is a sample code used in [this](https://detect-personal-protective-equipment.workshop.aws/en/) workshop .

For more information on how to deploy the application , please visit the link above.

Quick Tip for restless developers
* Ensure you have cdk cli installed. Details [here](!https://docs.aws.amazon.com/cdk/latest/guide/cli.html). Follow instructions mentioned in `Specifying credentials and region` section as well to make sure CDK Toolkit knows your AWS account credentials and the AWS region into which you are deploying.
* Change the email id in `bin\ppe_app_ts.ts` to an email id on which you want to receive the notification
* run `npm install` in root directory and in lambda directory
* run `cdk deploy --all` to deploy the application
* Do not forget to run `cdk destroy --all` to destroy all stacks