const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

// Khởi tạo SQS Client (Khu vực có thể thay đổi tùy cấu hình của Nam và Thiên)
const sqsClient = new SQSClient({ region: "ap-southeast-1" });

exports.handler = async (event) => {
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

        // 4. Lấy URL của SQS Queue từ biến môi trường (Environment Variables)
        const queueUrl = process.env.SQS_QUEUE_URL;
        if (queueUrl) {
            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(messagePayload)
            });
            await sqsClient.send(command);
            console.log(`Đã đẩy yêu cầu phân tích ${stockSymbol} vào SQS.`);
        } else {
            console.warn("Chưa cấu hình biến môi trường SQS_QUEUE_URL. Bỏ qua bước đẩy vào SQS.");
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