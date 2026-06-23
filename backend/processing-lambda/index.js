const stockService = require("./services/stockService");
const aiService = require("./services/aiService");
const dbService = require("./services/dbService");
const notificationService = require("./services/notificationService");
const technicalIndicators = require("./utils/technicalIndicators");

exports.handler = async (event) => {
    console.log("Processing Lambda nhận sự kiện từ SQS:", JSON.stringify(event, null, 2));

    try {
        // Đảm bảo có danh sách bản ghi
        if (!event.Records || event.Records.length === 0) {
            console.log("Không tìm thấy bản ghi SQS nào để xử lý.");
            return { statusCode: 200, body: "Không có bản ghi" };
        }

        // SQS có thể gửi nhiều message cùng lúc dưới dạng mảng Records
        for (const record of event.Records) {
            const messageBody = JSON.parse(record.body);
            const { stockSymbol, timeFrame } = messageBody;

            console.log(`\n=== BẮT ĐẦU XỬ LÝ PHÂN TÍCH: Mã ${stockSymbol} (Khung: ${timeFrame}) ===`);

            // 1. Lấy dữ liệu lịch sử giá từ nhà cung cấp dữ liệu chứng khoán
            const history = await stockService.getHistoricalData(stockSymbol, timeFrame);
            if (!history || history.length === 0) {
                console.warn(`Không lấy được lịch sử giá cho mã ${stockSymbol}`);
                continue;
            }

            const latestPrice = history[history.length - 1].close;
            console.log(`Giá hiện tại của ${stockSymbol} là: ${latestPrice.toLocaleString()} VND`);

            // 2. Tính toán các chỉ báo kỹ thuật tự động
            const indicators = technicalIndicators.calculateAllIndicators(history);
            console.log(`Chỉ số kỹ thuật tính toán: RSI = ${indicators.rsi}, MA20 = ${indicators.ma20}, MA50 = ${indicators.ma50}`);

            // 3. Gửi dữ liệu kỹ thuật qua AI Bedrock để phân tích chuyên sâu
            const aiAnalysis = await aiService.generateTechnicalAnalysis(stockSymbol, history, indicators);
            console.log(`AI khuyến nghị: [${aiAnalysis.recommendation}]`);

            // 4. Lưu báo cáo phân tích tổng hợp vào DynamoDB
            const reportPayload = {
                stockSymbol,
                timeFrame,
                timestamp: new Date().toISOString(),
                currentPrice: latestPrice,
                indicators,
                aiAnalysis
            };
            await dbService.saveAnalysisReport(reportPayload);

            // 5. Kiểm tra và kích hoạt các cảnh báo giá của người dùng
            const activeAlerts = await dbService.getActiveAlertsForSymbol(stockSymbol);
            for (const alert of activeAlerts) {
                let isTriggered = false;

                if (alert.condition === "ABOVE" && latestPrice >= alert.targetPrice) {
                    isTriggered = true;
                } else if (alert.condition === "BELOW" && latestPrice <= alert.targetPrice) {
                    isTriggered = true;
                }

                if (isTriggered) {
                    console.log(`[ALERT] Thỏa mãn điều kiện cảnh báo cho alertId: ${alert.alertId}. Tiến hành gửi...`);
                    const sent = await notificationService.sendAlertNotification(alert, latestPrice);
                    if (sent) {
                        // Cập nhật trạng thái trong DynamoDB thành TRIGGERED để không gửi lặp lại
                        await dbService.updateAlertStatus(alert.alertId, "TRIGGERED");
                    }
                }
            }

            console.log(`=== HOÀN THÀNH XỬ LÝ PHÂN TÍCH: Mã ${stockSymbol} ===\n`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Xử lý thành công toàn bộ tin nhắn SQS" })
        };
    } catch (error) {
        console.error("Lỗi Processing Lambda:", error);
        throw error; // Ném lỗi để SQS biết để retry nếu cần
    }
};