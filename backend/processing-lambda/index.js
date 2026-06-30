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

            // 4. Lưu báo cáo phân tích tổng hợp vào DynamoDB (bổ sung các trường đáp ứng yêu cầu vẽ biểu đồ và hiển thị của Frontend)
            const previousClose = history.length > 1 ? history[history.length - 2].close : latestPrice;
            const change = latestPrice - previousClose;
            const changePercent = previousClose > 0 ? parseFloat(((change / previousClose) * 100).toFixed(2)) : 0;
            
            const companyNames = {
                "FPT": "FPT Corporation",
                "VNM": "Vinamilk",
                "VIC": "Vingroup",
                "HPG": "Hòa Phát Group",
                "MWG": "Thế Giới Di Động",
                "VCB": "Vietcombank",
                "TCB": "Techcombank",
                "MSN": "Masan Group"
            };
            const companyName = companyNames[stockSymbol.toUpperCase()] || `${stockSymbol.toUpperCase()} Corporation`;

            // Định dạng lịch sử giá: đổi thuộc tính 'time' thành 'date' và chỉ lấy 30 phiên gần nhất cho chart của Frontend
            const priceHistory = history.map(p => ({
                date: p.time,
                open: p.open,
                high: p.high,
                low: p.low,
                close: p.close,
                volume: p.volume
            })).slice(-30);

            const reportPayload = {
                stockSymbol,
                companyName,
                timeFrame,
                timestamp: new Date().toISOString(),
                currentPrice: latestPrice,
                previousClose,
                change,
                changePercent,
                indicators,
                aiAnalysis,
                priceHistory
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