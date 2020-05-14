const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');
const aws = require('aws-sdk');
const fs = require('fs');


module.exports.uploadPhoto = async (file) => {
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        bBucket: process.env.AWS_BUCKET,
    });
    const fileContent = fs.readFileSync(file.location);
    const upload = await s3.upload({
        Bucket: process.env.AWS_BUCKET,
        Key: `uploads/${file.name}`, //uploads/...
        Body: fileContent
    }).promise();
    console.log(upload.Location);
    if (!upload) return null;
    return upload;
}
