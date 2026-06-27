/**
 * test local cho hệ thống Backend (Lambda)
 */
require('dotenv').config(); // Dòng này sẽ đọc file .env vào process.env


const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

// 1. Khởi tạo bộ kiểm tra Token
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID || "DUMMY_POOL_ID",
  tokenUse: "id",
  clientId: process.env.CLIENT_ID || "DUMMY_CLIENT_ID",
});

// 2. Khởi tạo kết nối với DynamoDB
const client = new DynamoDBClient({ region: "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    // === CỬA BẢO VỆ (AUTH CHECK) ===
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return {
                statusCode: 401,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Truy cập bị từ chối. Vui lòng đăng nhập!" })
            };
        }
        const token = authHeader.split(" ")[1];
        // if (process.env.USER_POOL_ID) {
        //     await verifier.verify(token);
        // }
        // Xác thực Token với AWS Cognito
        if (process.env.USER_POOL_ID && process.env.USER_POOL_ID !== "ap-southeast-1_fakePool123") {
            const payload = await verifier.verify(token);
            console.log("Người dùng hợp lệ:", payload.email);
        } else {
            console.log("Đang chạy chế độ Local - Bỏ qua xác thực Cognito!");
        }
        
    } catch (err) {
        return {
            statusCode: 401,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." })
        };
    }

    // === LOGIC LẤY BÁO CÁO TỪ DYNAMODB ===
    try {
        // Lấy mã cổ phiếu từ URL (Ví dụ: /api/reports?symbol=FPT)
        const symbol = event.queryStringParameters?.symbol;
        
        if (!symbol) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Thiếu tham số symbol (mã cổ phiếu)." })
            };
        }

        // Truy vấn bảng StockReports để lấy báo cáo mới nhất của mã cổ phiếu này
        const command = new QueryCommand({
            TableName: "StockReports",
            KeyConditionExpression: "stockSymbol = :symbol",
            ExpressionAttributeValues: {
                ":symbol": symbol.toUpperCase()
            },
            ScanIndexForward: false, // Sắp xếp giảm dần để lấy cái mới nhất (thời gian gần nhất)
            Limit: 1
        });

        const response = await docClient.send(command);

        if (!response.Items || response.Items.length === 0) {
            return {
                statusCode: 404,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Không tìm thấy dữ liệu phân tích cho mã cổ phiếu yêu cầu." })
            };
        }

        // Trả kết quả về cho Frontend
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(response.Items[0]) // Trả về object báo cáo mới nhất
        };

    } catch (error) {
        console.error("Lỗi khi lấy báo cáo:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Lỗi hệ thống khi lấy báo cáo phân tích." })
        };
    }
};