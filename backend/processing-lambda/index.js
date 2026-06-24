const stockService = require("./services/stockService");
const aiService = require("./services/aiService");
const dbService = require("./services/dbService");
const notificationService = require("./services/notificationService");
const technicalIndicators = require("./utils/technicalIndicators");

function normalizeRecommendation(recommendation = "") {
    return String(recommendation)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function isStrongAiSignal(aiAnalysis = {}) {
    const recommendation = normalizeRecommendation(aiAnalysis.recommendation);
    return ["BUY", "SELL", "MUA MANH", "BAN MANH"].includes(recommendation);
}

exports.handler = async (event) => {
    console.log("Processing Lambda nhan su kien tu SQS:", JSON.stringify(event, null, 2));

    try {
        if (!event.Records || event.Records.length === 0) {
            console.log("Khong tim thay ban ghi SQS nao de xu ly.");
            return { statusCode: 200, body: "Khong co ban ghi" };
        }

        for (const record of event.Records) {
            const messageBody = JSON.parse(record.body);
            const { stockSymbol, timeFrame } = messageBody;

            console.log(`\n=== BAT DAU XU LY PHAN TICH: Ma ${stockSymbol} (Khung: ${timeFrame}) ===`);

            const history = await stockService.getHistoricalData(stockSymbol, timeFrame);
            if (!history || history.length === 0) {
                console.warn(`Khong lay duoc lich su gia cho ma ${stockSymbol}`);
                continue;
            }

            const latestPrice = history[history.length - 1].close;
            console.log(`Gia hien tai cua ${stockSymbol} la: ${latestPrice.toLocaleString()} VND`);

            const indicators = technicalIndicators.calculateAllIndicators(history);
            console.log(`Chi so ky thuat: RSI = ${indicators.rsi}, MA20 = ${indicators.ma20}, MA50 = ${indicators.ma50}`);

            const aiAnalysis = await aiService.generateTechnicalAnalysis(stockSymbol, history, indicators);
            console.log(`AI khuyen nghi: [${aiAnalysis.recommendation}]`);

            const reportPayload = {
                stockSymbol,
                timeFrame,
                timestamp: new Date().toISOString(),
                currentPrice: latestPrice,
                indicators,
                aiAnalysis
            };

            await dbService.saveAnalysisReport(reportPayload);

            if (isStrongAiSignal(aiAnalysis)) {
                console.log(`[AI ALERT] AI Agent phat hien tin hieu manh cho ${stockSymbol}. Tu dong tao canh bao.`);
                await dbService.saveGeneratedAlert(reportPayload);
                await notificationService.sendAiSignalNotification(reportPayload);
            } else {
                console.log(`[AI ALERT] ${stockSymbol} khong co tin hieu manh, bo qua gui canh bao.`);
            }

            console.log(`=== HOAN THANH XU LY PHAN TICH: Ma ${stockSymbol} ===\n`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Xu ly thanh cong toan bo tin nhan SQS" })
        };
    } catch (error) {
        console.error("Loi Processing Lambda:", error);
        throw error;
    }
};
