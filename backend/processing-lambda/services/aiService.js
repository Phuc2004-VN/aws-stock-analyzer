/**
 * Dịch vụ tích hợp AI Bedrock để phân tích kỹ thuật chứng khoán.   
 */
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

// Khởi tạo Bedrock Runtime Client (vùng mặc định là ap-southeast-1 hoặc us-east-1 tùy cấu hình Bedrock)
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

/**
 * Gửi dữ liệu kỹ thuật qua AI Bedrock để phân tích và đưa ra khuyến nghị.
 * @param {string} stockSymbol 
 * @param {Array} history 
 * @param {Object} indicators 
 * @returns {Promise<Object>} Báo cáo phân tích { recommendation, reasoning }
 */
async function generateTechnicalAnalysis(stockSymbol, history, indicators) {
    console.log(`[aiService] Đang gọi Bedrock phân tích cho mã ${stockSymbol}...`);
    
    // Nếu chưa cấu hình Bedrock Model ID hoặc chạy local không có quyền AWS, trả về mock AI analysis
    const modelId = process.env.BEDROCK_MODEL_ID;
    if (!modelId) {
        console.warn("Chưa cấu hình BEDROCK_MODEL_ID. Sử dụng dữ liệu phân tích AI giả định.");
        
        let recommendation = "HOLD";
        let reasoning = `Chỉ số RSI ở mức ${indicators.rsi.toFixed(1)}. Đường giá dao động quanh các đường trung bình động. Khuyến nghị nhà đầu tư tiếp tục theo dõi diễn biến thị trường.`;
        
        if (indicators.rsi < 35) {
            recommendation = "BUY";
            reasoning = `Chỉ số RSI chạm vùng quá bán (${indicators.rsi.toFixed(1)}). Giá cổ phiếu đang có dấu hiệu tạo đáy ngắn hạn quanh vùng hỗ trợ. Khuyến nghị MUA tích lũy.`;
        } else if (indicators.rsi > 70) {
            recommendation = "SELL";
            reasoning = `Chỉ số RSI đạt vùng quá mua (${indicators.rsi.toFixed(1)}). Giá cổ phiếu đã tăng nóng trong thời gian ngắn và gặp áp lực chốt lời lớn. Khuyến nghị BÁN hiện thực hóa lợi nhuận.`;
        }
        
        return { recommendation, reasoning };
    }
    
    try {
        // Cấu trúc payload gửi cho Claude v3 Sonnet/Haiku (hoặc model Bedrock khác)
        const prompt = `Bạn là một chuyên gia phân tích kỹ thuật chứng khoán. Hãy phân tích mã cổ phiếu ${stockSymbol} dựa trên các thông số sau:
            - Giá hiện tại: ${history[history.length - 1].close}
            - Chỉ báo RSI: ${indicators.rsi}
            - Chỉ báo MA20: ${indicators.ma20}
            - Chỉ báo MA50: ${indicators.ma50}

            Hãy đưa ra:
            1. Khuyến nghị hành động duy nhất: BUY, HOLD hoặc SELL.
            2. Đoạn giải thích ngắn gọn (reasoning) lý do vì sao đưa ra khuyến nghị đó.
            Trả về kết quả dưới định dạng JSON có dạng: {"recommendation": "BUY|HOLD|SELL", "reasoning": "Lý do..."}`;

        const inputPayload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 500,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }]
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(inputPayload)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Parse kết quả trả về từ Bedrock Claude
        const aiText = responseBody.content[0].text;
        return JSON.parse(aiText);
    } catch (error) {
        console.error("Lỗi khi gọi Bedrock:", error);
        // Fallback khi lỗi
        return {
            recommendation: "HOLD",
            reasoning: `Lỗi kết nối AI Bedrock. Vui lòng kiểm tra lại cấu hình. (Chi tiết: ${error.message})`
        };
    }
}

module.exports = {
    generateTechnicalAnalysis
};
