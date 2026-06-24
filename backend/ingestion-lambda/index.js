require("dotenv").config();

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const awsRegion = process.env.AWS_REGION || "ap-southeast-1";
const s3Client = new S3Client({ region: awsRegion });
const sqsClient = new SQSClient({ region: awsRegion });

let verifier;

function jsonResponse(statusCode, payload) {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    };
}

function isLocalAuthDisabled() {
    return !process.env.USER_POOL_ID || ["fake_pool_id", "DUMMY_POOL_ID"].includes(process.env.USER_POOL_ID);
}

async function verifyRequest(event) {
    if (isLocalAuthDisabled()) {
        console.log("Dang chay local - bo qua xac thuc Cognito.");
        return;
    }

    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const error = new Error("Truy cap bi tu choi. Vui long dang nhap.");
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.split(" ")[1];
    if (!verifier) {
        verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.USER_POOL_ID,
            tokenUse: "id",
            clientId: process.env.CLIENT_ID
        });
    }
    const payload = await verifier.verify(token);
    console.log("Nguoi dung hop le:", payload.email || payload.sub);
}

async function saveRawRequestToS3(payload) {
    const bucketName = process.env.RAW_DATA_BUCKET;
    if (!bucketName) {
        console.warn("Chua cau hinh RAW_DATA_BUCKET. Bo qua buoc luu raw JSON vao S3.");
        return null;
    }

    const safeTimestamp = payload.timestamp.replace(/[:.]/g, "-");
    const objectKey = `raw-ingestion/${payload.stockSymbol}/${safeTimestamp}.json`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: JSON.stringify(payload, null, 2),
        ContentType: "application/json"
    });

    await s3Client.send(command);
    console.log(`Da luu raw ingestion vao S3: s3://${bucketName}/${objectKey}`);
    return objectKey;
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod === "OPTIONS" || event.requestContext?.http?.method === "OPTIONS") {
            return jsonResponse(200, { message: "OK" });
        }

        await verifyRequest(event);

        const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : (event.body || {});
        const { stockSymbol, timeFrame } = body;

        if (!stockSymbol || !timeFrame) {
            return jsonResponse(400, { message: "Thieu thong tin ma co phieu hoac khung thoi gian." });
        }

        const messagePayload = {
            stockSymbol: stockSymbol.toUpperCase(),
            timeFrame,
            timestamp: new Date().toISOString(),
            status: "PENDING"
        };

        const rawObjectKey = await saveRawRequestToS3(messagePayload);

        const queueUrl = process.env.SQS_QUEUE_URL;
        if (queueUrl) {
            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify({
                    ...messagePayload,
                    rawObjectKey
                })
            });
            await sqsClient.send(command);
            console.log(`Da day yeu cau phan tich ${stockSymbol} vao SQS.`);
        } else {
            console.warn("Chua cau hinh SQS_QUEUE_URL. Bo qua buoc day vao SQS.");
        }

        return jsonResponse(200, {
            message: "Da tiep nhan yeu cau phan tich thanh cong",
            data: {
                ...messagePayload,
                rawObjectKey
            }
        });
    } catch (error) {
        console.error("Loi Ingestion Lambda:", error);
        return jsonResponse(error.statusCode || 500, {
            message: error.statusCode === 401 ? error.message : "Loi may chu noi bo",
            error: error.message
        });
    }
};
