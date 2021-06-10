const AWS = require("aws-sdk");
const { TABLE_NAME, TRANSLATE_TO } = process.env;
const translate = new AWS.Translate();
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
  //Read the message from event

  var message = event.Records[0].Sns.Message;
  var snsArn = event.Records[0].Sns.TopicArn;

  console.log("message : ", message, " snsarn : ", snsArn);

  //call the translation API

  var params = {
    SourceLanguageCode: "en",
    TargetLanguageCode: TRANSLATE_TO,
    Text: message,
  };
  var translatedText = 'Not Available';

  const translatoresponse = await translate.translateText(params).promise();
  console.log('translate response is : '+ JSON.stringify(translatoresponse));
  translatedText = translatoresponse.TranslatedText

  var ddbparam = {
    TableName: TABLE_NAME,
    Item: {
      id: context.awsRequestId,
      topic: snsArn,
      originalmessage: message,
      translatedtext: translatedText,
    }
  };
  const dynamodbresponse =  await docClient.put(ddbparam).promise();
  console.log('ddb response ',JSON.stringify(dynamodbresponse));

  return {
    translatedText
  }
};
