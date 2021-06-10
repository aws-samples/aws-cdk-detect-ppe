#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PpeAppTsStack } from '../lib/ppe_app_ts-stack';
import { TranslatorStack } from '../lib/translator-stack';


const app = new cdk.App();


const workshopClient = new PpeAppTsStack(app, 'workshopstack' ,{
    snsEmailNotification: 'myemailid@domainname.com',
    DETECTFACECOVER: true,
    DETECTHANDCOVER: true,
    DETECTHEADCOVER: true
});

const pharmacyClient = new PpeAppTsStack(app, 'pharmacystack' ,{
    snsEmailNotification: 'myemailid@domainname.com',
    DETECTFACECOVER: true,
    DETECTHANDCOVER: true,
    DETECTHEADCOVER: false
});

const snstopics = [workshopClient.snsTopic,pharmacyClient.snsTopic];

new TranslatorStack(app,'Translator',{
    snsTopic: snstopics,
    translateTo: 'hi'
})