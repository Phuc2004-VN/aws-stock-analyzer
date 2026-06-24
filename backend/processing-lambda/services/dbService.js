const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const REPORTS_TABLE = process.env.REPORTS_TABLE_NAME || "StockReports";
const ALERTS_TABLE = process.env.ALERTS_TABLE_NAME || "StockAlerts";

async function saveAnalysisReport(report) {
    console.log(`[dbService] Dang luu bao cao phan tich cho ${report.stockSymbol} vao bang ${REPORTS_TABLE}...`);
    try {
        const command = new PutCommand({
            TableName: REPORTS_TABLE,
            Item: {
                stockSymbol: report.stockSymbol,
                timeFrameTimestamp: `${report.timeFrame}#${report.timestamp}`,
                timeFrame: report.timeFrame,
                timestamp: report.timestamp,
                currentPrice: report.currentPrice,
                indicators: report.indicators,
                aiAnalysis: report.aiAnalysis
            }
        });
        await docClient.send(command);
        console.log("[dbService] Luu bao cao thanh cong.");
    } catch (error) {
        console.error("[dbService] Loi khi luu bao cao:", error);
    }
}

async function saveGeneratedAlert(report) {
    const alertId = `AI#${report.stockSymbol}#${report.timestamp}`;
    console.log(`[dbService] Dang luu canh bao AI tu sinh ${alertId} vao bang ${ALERTS_TABLE}...`);

    try {
        const command = new PutCommand({
            TableName: ALERTS_TABLE,
            Item: {
                alertId,
                stockSymbol: report.stockSymbol,
                stockTimestamp: `${report.stockSymbol}#${report.timestamp}`,
                timestamp: report.timestamp,
                currentPrice: report.currentPrice,
                recommendation: report.aiAnalysis.recommendation,
                confidenceScore: report.aiAnalysis.confidence_score || report.aiAnalysis.confidenceScore || null,
                reasoning: report.aiAnalysis.reasoning_trace || report.aiAnalysis.reasoning || "",
                source: "AI_AGENT",
                status: "SENT"
            }
        });
        await docClient.send(command);
        console.log("[dbService] Luu canh bao AI thanh cong.");
    } catch (error) {
        console.error("[dbService] Loi khi luu canh bao AI:", error);
    }
}

module.exports = {
    saveAnalysisReport,
    saveGeneratedAlert
};
