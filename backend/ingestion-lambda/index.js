/**
 * test local cho hệ thống Backend (Lambda)
 */
require('dotenv').config(); // Dòng này sẽ đọc file .env vào process.env


const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Khởi tạo SQS Client
const sqsClient = new SQSClient({ region: "ap-southeast-1" });

// Khởi tạo bộ kiểm tra Token (Lấy ID từ biến môi trường, cấu hình AWS sẽ truyền vào sau)
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID || "DUMMY_POOL_ID",
  tokenUse: "id",
  clientId: process.env.CLIENT_ID || "DUMMY_CLIENT_ID",
});

const reports = require('./reports-logic');
const alerts = require('./alerts-logic');

exports.handler = async (event) => {
    const path = event.path || "";
    // Dùng includes để bắt đúng API dù có prefix (/api/...) hay params (/alerts/123)
    if (path.includes('/reports')) return reports.handler(event);
    if (path.includes('/alerts')) return alerts.handler(event);

    // === BƯỚC 1: KIỂM TRA BẢO MẬT CỬA VÀO ===
    try {
        // Lấy token từ header mà Frontend gửi lên (thường có dạng "Bearer xxxx.yyyy.zzzz")
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return {
                statusCode: 401,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Truy cập bị từ chối. Vui lòng đăng nhập!" })
            };
        }

        // Cắt lấy đoạn mã Token thực sự
        const token = authHeader.split(" ")[1];

        // Xác thực Token với AWS Cognito (Nếu đang chạy local không có Pool ID thì bỏ qua để test logic)
        // if (process.env.USER_POOL_ID) {
        //     const payload = await verifier.verify(token);
        //     console.log("Người dùng hợp lệ:", payload.email);
        // } else {
        //     console.warn("Chưa có cấu hình Cognito. Tạm thời cho qua để test Local.");
        // }
        // Xác thực Token với AWS Cognito
        if (process.env.USER_POOL_ID && process.env.USER_POOL_ID !== "ap-southeast-1_fakePool123") {
            const payload = await verifier.verify(token);
            console.log("Người dùng hợp lệ:", payload.email);
        } else {
            console.log("Đang chạy chế độ Local - Bỏ qua xác thực Cognito!");
        }

    } catch (err) {
        console.error("Token không hợp lệ hoặc đã hết hạn:", err);
        return {
            statusCode: 401,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Phiên đăng nhập không hợp lệ." })
        };
    }

    try {
        // 1. Parse dữ liệu từ API Gateway
        const body = JSON.parse(event.body);
        const { stockSymbol, timeFrame } = body;

        // 2. Validate dữ liệu đầu vào
        if (!stockSymbol || !timeFrame) {
            return {
                statusCode: 400,
                headers: { 
                    "Access-Control-Allow-Origin": "*", 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ message: "Thiếu thông tin mã cổ phiếu hoặc khung thời gian." })
            };
        }

        // 3. Chuẩn bị payload để đẩy vào SQS
        const messagePayload = {
            stockSymbol: stockSymbol.toUpperCase(),
            timeFrame: timeFrame,
            timestamp: new Date().toISOString(),
            status: "PENDING"
        };

        // // 4. Lấy URL của SQS Queue từ biến môi trường (Environment Variables)
        // const queueUrl = process.env.SQS_QUEUE_URL;
        // if (queueUrl) {
        //     const command = new SendMessageCommand({
        //         QueueUrl: queueUrl,
        //         MessageBody: JSON.stringify(messagePayload)
        //     });
        //     await sqsClient.send(command);
        //     console.log(`Đã đẩy yêu cầu phân tích ${stockSymbol} vào SQS.`);
        // } else {
        //     console.warn("Chưa cấu hình biến môi trường SQS_QUEUE_URL. Bỏ qua bước đẩy vào SQS.");
        // }

        // 4. Lấy URL của SQS Queue từ biến môi trường (Environment Variables)
        const queueUrl = process.env.SQS_QUEUE_URL;
        
        // Thêm điều kiện !== "fake_sqs_url" vào đây nè:
        if (queueUrl && queueUrl !== "fake_sqs_url") { 
            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(messagePayload)
            });
            await sqsClient.send(command);
            console.log(`Đã đẩy yêu cầu phân tích ${stockSymbol} vào SQS.`);
        } else {
            console.log(`[LOCAL MODE] Đã giả lập đẩy yêu cầu ${stockSymbol} vào SQS thành công! Bỏ qua kết nối AWS thật.`);
        }

        // 5. Trả về kết quả cho Frontend
        return {
            statusCode: 200,
            headers: { 
                "Access-Control-Allow-Origin": "*", 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                message: "Đã tiếp nhận yêu cầu phân tích thành công",
                data: messagePayload
            })
        };

    } catch (error) {
        console.error("Lỗi Ingestion Lambda:", error);
        
        return {
            statusCode: 500,
            headers: { 
                "Access-Control-Allow-Origin": "*", 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ message: "Lỗi máy chủ nội bộ", error: error.message })
        };
    }
};