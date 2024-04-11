const AWS = require("aws-sdk");
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');


const downloadImage = async (url, outputPath) => {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

const convertToWebP = async (inputPath, outputPath) => {
    const inputBuffer = fs.readFileSync(inputPath);
    const webPBuffer = await sharp(inputBuffer).webp().toBuffer();
    fs.writeFileSync(outputPath, webPBuffer);
};

// Function to upload file to S3
const uploadFileToS3 = (filePath, bucketName, key) => {
    const fileStream = fs.createReadStream(filePath);

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: "image/webp",
        ACL : "public-read"
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

//put AWS Configuration here 


Promise.all(Object.entries(templates).map(async ([templateName, template]) => {
    // imageURL 
    // funnel-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/funnel/${templateName}/image.jpg`;
    // page-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/page/${templateName}/image.jpg`;
    // popup-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/popup/${templateName}/image.jpg`;
    // section-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/section/${templateName}/image.jpg`;
    // step-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/step/${templateName}/image.jpg`;
    // mobile-slide -imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/mobile/slide/step/${templateName}/image.jpg`;
    // mobile-page-imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/mobile/page${templateName}/image.jpg`;
    const imageUrl = `https://sp-assets-staging.sgp1.digitaloceanspaces.com/templates/funnel/${templateName}/image.jpg`;
    const inputImagePath = `${templateName}.jpg`;
    const outputImagePath = `${templateName}.webp`;
console.log("imageUrl",imageUrl)
    try {

        await downloadImage(imageUrl, inputImagePath);
        console.log(`Image for template ${templateName} downloaded successfully`);
        await convertToWebP(inputImagePath, outputImagePath);
        console.log(`Image for template ${templateName} converted to WebP successfully`);

        // Upload to S3

    //    KEY
    //     key for page : templates/page/${templateName}/image.webp
    //     key for funnel : templates/funnel/${templateName}/image.webp
    //     key for popup : templates/popup/${templateName}/image.webp
    //     key for section : templates/section/${templateName}/image.webp
    //     key for step : templates/step/${templateName}/image.webp
    //     key for mobile-slide : templates/mobile/slide/${templateName}/image.webp
    //     key for mobile-page : templates/mobile/page/${templateName}/image.webp
        const bucketName = 'sp-assets-staging';
        const key = `templates/funnel/${templateName}/image.webp`;
        const filePath = outputImagePath;
        const uploadResult = await uploadFileToS3(filePath, bucketName, key);
        console.log(`File for template ${templateName} uploaded to S3 successfully: ${uploadResult.Location}`);
    } catch (error) {
        console.error(`Error processing template ${templateName}:`, error);
    }
})).then(() => {
    console.log("All templates processed successfully");
}).catch(error => {
    console.error("Error processing templates:", error);
});
