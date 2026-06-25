/**
 * test local cho hệ thống Backend (Lambda)
 */
require('dotenv').config(); // Dòng này sẽ đọc file .env vào process.env


const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto"); // Thư viện mặc định của Node.js để tạo UUID

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

    const httpMethod = event.httpMethod;

    try {
        // === XỬ LÝ API 1.3: TẠO CẢNH BÁO MỚI (POST) ===
        if (httpMethod === "POST") {
            const body = JSON.parse(event.body);
            const alertId = crypto.randomUUID(); // Tạo ID ngẫu nhiên
            
            const newAlert = {
                alertId: alertId,
                stockSymbol: body.stockSymbol.toUpperCase(),
                targetPrice: body.targetPrice,
                condition: body.condition,
                email: body.email,
                status: "ACTIVE",
                createdAt: new Date().toISOString()
            };

            await docClient.send(new PutCommand({
                TableName: "StockAlerts",
                Item: newAlert
            }));

            return {
                statusCode: 201,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(newAlert)
            };
        }

        // === XỬ LÝ API 1.4: LẤY DANH SÁCH CẢNH BÁO (GET) ===
        if (httpMethod === "GET") {
            const email = event.queryStringParameters?.email;
            if (!email) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ message: "Thiếu tham số email." })
                };
            }

            const command = new ScanCommand({
                TableName: "StockAlerts",
                FilterExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": email
                }
            });

            const response = await docClient.send(command);
            
            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(response.Items || [])
            };
        }

        // === XỬ LÝ API 1.5: XÓA CẢNH BÁO (DELETE) ===
        if (httpMethod === "DELETE") {
            // Giả sử cấu hình trên API Gateway là /api/alerts/{alertId}
            const alertId = event.pathParameters?.alertId;
            if (!alertId) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ message: "Thiếu alertId để xóa." })
                };
            }

            await docClient.send(new DeleteCommand({
                TableName: "StockAlerts",
                Key: { alertId: alertId }
            }));

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Đã xóa cảnh báo thành công" })
            };
        }

        // Nếu gọi sai phương thức (VD: PUT, PATCH)
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Phương thức không được hỗ trợ" })
        };

    } catch (error) {
        console.error("Lỗi xử lý Alerts API:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Lỗi hệ thống khi xử lý cảnh báo." })
        };
    }
};