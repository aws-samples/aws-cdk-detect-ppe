const AWS = require("aws-sdk");
const { TABLE_NAME, SNS_TOPIC, FACECOVER, HEADCOVER, HANDCOVER } = process.env;
const rekognition = new AWS.Rekognition();
const docClient = new AWS.DynamoDB.DocumentClient();
const snsClient = new AWS.SNS();

exports.handler = async function (event, context) {
  //Read the bucket name and key from the event
  console.log("ENV ", JSON.stringify(process.env));
  const srcBucket = event.Records[0].s3.bucket.name;
  const srcKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const typeMatch = srcKey.match(/\.([^.]*)$/);

  //ensure the type fo file is image
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpeg" && imageType != "png" && imageType != "jpg") {
    console.log("Unsupported image type:", imageType);
    return;
  }
  
  try {
    // Call rekonition API
    const ppeparams = {
      Image: {
        S3Object: {
          Bucket: srcBucket,
          Name: srcKey,
        },
      },
    };
    const rekognitionresponse = await rekognition
      .detectProtectiveEquipment(ppeparams)
      .promise();
    //console.log('rekognition response ',JSON.stringify(rekognitionresponse));
    // Insert the data in dynamodb table for further processing

    const dynamodbparam = {
      TableName: TABLE_NAME,
      Item: {
        id: context.awsRequestId,
        objectkey: srcKey,
        bucketname: srcBucket,
        rekonitionResponse: rekognitionresponse.Persons,
      },
    };

    const dynamoddbresponese = await docClient.put(dynamodbparam).promise();
    //console.log('Dynamodb response ',JSON.stringify(rekognitionresponse));

    var message = [];
    var personcount = 0;
    //based on the logic, determine if the notification needs to be send
    if (rekognitionresponse.Persons.length < 1) {
      //console.log("No Person in the image");
      message.push("No Person in the image");
    } else {
      // check for the body part (face, left_hand, right_hand, head)
      // If any of the body part is detected check if there is a protective equipment detected  with confidence
      // If the requirement is to have ppe for the bodypart and there is no ppe detected for that body part, send notificatoin

      rekognitionresponse.Persons.forEach((person) => {
        personcount++;
        if (FACECOVER == "true") {
          var face = person.BodyParts.find(
            (bodypart) => bodypart.Name == "FACE"
          );
          console.log("Face ", face);
          if (face == null) {
            // no face is detected. Should be notified
            
            message.push(
              "Image does not contain face for person " + personcount
            );
          } else if (face.EquipmentDetections.length <= 0) {
            // no face equipment is detected, Should be notified
            
            message.push(
              "Image does not contain face cover for person" + personcount
            );
          }
        }
        if (HEADCOVER == "true") {
          var head = person.BodyParts.find(
            (bodypart) => bodypart.Name == "HEAD"
          );
          console.log("head ", head);
          if (head == null) {
            // no face is detected. Should be notified
            
            message.push(
              "Image does not contain head for person " + personcount
            );
          } else if (head.EquipmentDetections.length <= 0) {
            // no face equipment is detected, Should be notified
            
            message.push(
              "Image does not contain head cover for person " + personcount
            );
          }
        }
        if (HANDCOVER == "true") {
          var hand = person.BodyParts.find(
            (bodypart) =>
              bodypart.Name == "LEFT_HAND" || bodypart.Name == "RIGHT_HAND"
          );
          console.log("hand ", hand);
          if (hand == null) {
            // no face is detected. Should be notified
            
            message.push(
              "Image does not contain hand for person " + personcount
            );
          } else if (hand.EquipmentDetections.length <= 0) {
            // no face equipment is detected, Should be notified
            
            message.push(
              "Image does not contain hand cover for person " + personcount
            );
          }
        }
      });
      console.log("message : ", JSON.stringify(message));
      if (message.length > 0) {
        var params = {
          Message: JSON.stringify(message) + " in " + srcBucket + "/" + srcKey,
          TopicArn: SNS_TOPIC,
        };
        await snsClient.publish(params).promise();
      }
    }
  } catch (error) {
    console.log(error);
    return;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body:
      "Successfully processed the image. " +
      "Image Location is  : " +
      srcBucket +
      " / " +
      srcKey,
  };
};
