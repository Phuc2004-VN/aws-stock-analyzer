const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const snsClient = new SNSClient({ region: process.env.AWS_REGION || "ap-southeast-1" });

function getReasoning(aiAnalysis = {}) {
    return aiAnalysis.reasoning_trace || aiAnalysis.reasoning || "AI Agent khong tra ve reasoning chi tiet.";
}

async function sendAiSignalNotification(report) {
    const snsTopicArn = process.env.SNS_TOPIC_ARN;
    const recommendation = report.aiAnalysis.recommendation;
    const confidence = report.aiAnalysis.confidence_score || report.aiAnalysis.confidenceScore || "N/A";

    console.log(`[notificationService] Chuan bi gui canh bao AI cho ${report.stockSymbol}: ${recommendation}`);

    if (!snsTopicArn) {
        console.warn("Chua cau hinh SNS_TOPIC_ARN. Gia lap gui canh bao AI thanh cong.");
        return true;
    }

    try {
        const message = `CANH BAO AI CO PHIEU: ${report.stockSymbol}
- Tin hieu AI: ${recommendation}
- Do tin cay: ${confidence}
- Gia hien tai: ${report.currentPrice.toLocaleString()} VND
- Thoi gian: ${new Date(report.timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
- Lap luan AI: ${getReasoning(report.aiAnalysis)}

Canh bao nay duoc AI Agent tu dong tao sau buoc phan tich Bedrock, khong phai nguong gia do nguoi dung cai dat.`;

        const command = new PublishCommand({
            TopicArn: snsTopicArn,
            Subject: `[AI Alert] ${report.stockSymbol} - ${recommendation}`,
            Message: message,
            MessageAttributes: {
                source: {
                    DataType: "String",
                    StringValue: "AI_AGENT"
                },
                stockSymbol: {
                    DataType: "String",
                    StringValue: report.stockSymbol
                }
            }
        });

        await snsClient.send(command);
        console.log("[notificationService] Da gui canh bao AI qua SNS thanh cong.");
        return true;
    } catch (error) {
        console.error("[notificationService] Loi khi gui canh bao AI:", error);
        return false;
    }
}

module.exports = {
    sendAiSignalNotification
};
