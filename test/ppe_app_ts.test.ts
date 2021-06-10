import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as PpeAppTs from '../lib/ppe_app_ts-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new PpeAppTs.PpeAppTsStack(app, 'MyTestStack',{
      snsEmailNotification: 'myemailid@domainname.com',
      DETECTFACECOVER: true,
      DETECTHANDCOVER: true,
      DETECTHEADCOVER: false
  });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
