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
        Key: `posts/${file.name}`, //uploads/...
        Body: fileContent
    }).promise();
    console.log(upload.Location);
    if (!upload) return null;
    return upload;
}

module.exports.deletePhoto = async (location) => {
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        bBucket: process.env.AWS_BUCKET,
    });
    const imageDeletion = await s3.deleteObject({
        Bucket: process.env.AWS_BUCKET,
        Key: location
    }).promise();
    if (!imageDeletion) {
        console.log('Image doesnt exist on the server')
    }
    else {
        console.log(imageDeletion);
    }
}