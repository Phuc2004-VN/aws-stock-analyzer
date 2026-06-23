const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const REPORTS_TABLE = process.env.REPORTS_TABLE_NAME || "StockReports";
const ALERTS_TABLE = process.env.ALERTS_TABLE_NAME || "StockAlerts";

/**
 * Lưu báo cáo phân tích tổng hợp vào DynamoDB.
 * @param {Object} report - Báo cáo phân tích { stockSymbol, timeFrame, timestamp, currentPrice, indicators, aiAnalysis }
 */
async function saveAnalysisReport(report) {
    console.log(`[dbService] Đang lưu báo cáo phân tích cho ${report.stockSymbol} vào bảng ${REPORTS_TABLE}...`);
    try {
        const command = new PutCommand({
            TableName: REPORTS_TABLE,
            Item: {
                stockSymbol: report.stockSymbol,
                timeFrameTimestamp: `${report.timeFrame}#${report.timestamp}`, // Sort key kết hợp
                timeFrame: report.timeFrame,
                timestamp: report.timestamp,
                currentPrice: report.currentPrice,
                indicators: report.indicators,
                aiAnalysis: report.aiAnalysis
            }
        });
        await docClient.send(command);
        console.log(`[dbService] Lưu báo cáo thành công.`);
    } catch (error) {
        console.error("[dbService] Lỗi khi lưu báo cáo:", error);
        // Không throw lỗi làm crash tiến trình nếu chỉ lỗi lưu report lịch sử (tùy thiết kế)
    }
}

/**
 * Lấy danh sách các cảnh báo đang kích hoạt (ACTIVE) của một mã cổ phiếu.
 * @param {string} stockSymbol 
 * @returns {Promise<Array>} Danh sách các cảnh báo thỏa mãn
 */
async function getActiveAlertsForSymbol(stockSymbol) {
    console.log(`[dbService] Tìm các cảnh báo ACTIVE cho mã ${stockSymbol} từ bảng ${ALERTS_TABLE}...`);
    try {
        const command = new QueryCommand({
            TableName: ALERTS_TABLE,
            IndexName: "GSI_StockSymbol", // Sử dụng Index phụ để truy vấn nhanh
            KeyConditionExpression: "stockSymbol = :symbol AND #status = :statusVal",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":symbol": stockSymbol.toUpperCase(),
                ":statusVal": "ACTIVE"
            }
        });
        const response = await docClient.send(command);
        return response.Items || [];
    } catch (error) {
        console.error("[dbService] Lỗi khi lấy active alerts:", error);
        // Trả về mảng rỗng để luồng không bị gián đoạn khi chạy local
        return [
            // Cung cấp một mock alert chạy local nếu không kết nối được DynamoDB
            {
                alertId: "mock-alert-id-1",
                stockSymbol: stockSymbol.toUpperCase(),
                targetPrice: stockSymbol === "FPT" ? 135000 : 90000,
                condition: "ABOVE",
                status: "ACTIVE",
                email: "phuc-test-alert@example.com"
            }
        ];
    }
}

/**
 * Cập nhật trạng thái của alert (thường chuyển thành TRIGGERED để tránh gửi lặp).
 * @param {string} alertId 
 * @param {string} newStatus 
 */
async function updateAlertStatus(alertId, newStatus) {
    console.log(`[dbService] Cập nhật trạng thái alert ${alertId} thành ${newStatus}...`);
    try {
        const command = new UpdateCommand({
            TableName: ALERTS_TABLE,
            Key: { alertId: alertId },
            UpdateExpression: "set #status = :newStatus",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":newStatus": newStatus
            }
        });
        await docClient.send(command);
        console.log(`[dbService] Cập nhật trạng thái alert thành công.`);
    } catch (error) {
        console.error("[dbService] Lỗi khi cập nhật trạng thái alert:", error);
    }
}

module.exports = {
    saveAnalysisReport,
    getActiveAlertsForSymbol,
    updateAlertStatus
};
