/**
 * File test local cho hệ thống Backend (Lambda)
 * Dùng để kiểm tra xem Ingestion Lambda và Processing Lambda hoạt động ổn định hay không.
 */

const ingestionHandler = require("./ingestion-lambda/index").handler;
const processingHandler = require("./processing-lambda/index").handler;

async function runLocalTests() {
    console.log("=== BẮT ĐẦU CHẠY THỬ HỆ THỐNG BACKEND LOCALLY ===\n");

    // 1. Giả lập yêu cầu từ API Gateway gửi tới Ingestion Lambda
    const mockApiGatewayEvent = {
        body: JSON.stringify({
            stockSymbol: "FPT",
            timeFrame: "1D"
        })
    };

    console.log("--- 1. Kiểm thử Ingestion Lambda ---");
    const ingestionResult = await ingestionHandler(mockApiGatewayEvent);
    console.log("Response từ Ingestion Lambda:", JSON.stringify(ingestionResult, null, 2));
    
    if (ingestionResult.statusCode !== 200) {
        console.error("Thất bại: Ingestion Lambda trả về lỗi.");
        return;
    }
    const responseData = JSON.parse(ingestionResult.body);
    console.log("Thành công: Ingestion Lambda xử lý và validate thành công.\n");

    // 2. Giả lập tin nhắn nhận từ SQS Queue gửi tới Processing Lambda
    const mockSqsEvent = {
        Records: [
            {
                body: JSON.stringify(responseData.data),
                messageId: "mock-message-id-99999"
            }
        ]
    };

    console.log("--- 2. Kiểm thử Processing Lambda ---");
    try {
        const processingResult = await processingHandler(mockSqsEvent);
        console.log("Response từ Processing Lambda:", JSON.stringify(processingResult, null, 2));
        console.log("Thành công: Processing Lambda chạy thông suốt tất cả các service (Mock).");
    } catch (err) {
        console.error("Thất bại: Processing Lambda gặp lỗi khi chạy:", err);
    }
}

runLocalTests();
