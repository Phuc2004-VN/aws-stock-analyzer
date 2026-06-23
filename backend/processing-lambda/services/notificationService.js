const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({ region: process.env.AWS_REGION || "ap-southeast-1" });

/**
 * Gửi thông báo cảnh báo qua SNS (Email/SMS).
 * @param {Object} alert - Đối tượng cảnh báo từ DynamoDB
 * @param {number} latestPrice - Giá hiện tại của cổ phiếu
 * @returns {Promise<boolean>} Trạng thái gửi thành công hay thất bại
 */
async function sendAlertNotification(alert, latestPrice) {
    console.log(`[notificationService] Chuẩn bị gửi cảnh báo cho ${alert.email}: Giá ${alert.stockSymbol} đã ${alert.condition === "ABOVE" ? "vượt trên" : "giảm dưới"} ${alert.targetPrice.toLocaleString()} VND (Giá hiện tại: ${latestPrice.toLocaleString()} VND)...`);
    
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    if (!snsTopicArn) {
        console.warn("Chưa cấu hình SNS_TOPIC_ARN. Gửi cảnh báo giả định thành công.");
        return true;
    }
    
    try {
        const message = `CẢNH BÁO GIÁ CỔ PHIẾU: Mã ${alert.stockSymbol} đã thỏa mãn điều kiện cảnh báo của bạn.
            - Điều kiện cài đặt: ${alert.condition} ${alert.targetPrice.toLocaleString()} VND
            - Giá hiện tại tại thời điểm kích hoạt: ${latestPrice.toLocaleString()} VND
            - Thời gian kích hoạt: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}

            Hệ thống phân tích kỹ thuật và cảnh báo giá tự động.`;

        const command = new PublishCommand({
            TopicArn: snsTopicArn,
            Subject: `[Cảnh Báo Giá] Mã cổ phiếu ${alert.stockSymbol}`,
            Message: message,
            MessageAttributes: {
                "email": {
                    DataType: "String",
                    StringValue: alert.email
                }
            }
        });

        await snsClient.send(command);
        console.log(`[notificationService] Đã gửi thông báo SNS thành công tới topic.`);
        return true;
    } catch (error) {
        console.error("[notificationService] Lỗi khi gửi thông báo SNS:", error);
        return false;
    }
}

module.exports = {
    sendAlertNotification
};
