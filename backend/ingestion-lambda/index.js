// exports.handler là entry point của Lambda function, nhận event từ API Gateway khi có request từ Frontend
exports.handler = async (event) => { // event chứa thông tin request từ Frontend, bao gồm body, headers, query params...
    // 1. Log dữ liệu đầu vào để dễ dàng debug trên AWS CloudWatch
    console.log("Received event:", JSON.stringify(event, null, 2));
    try {
        // 2. Parse dữ liệu (payload) gửi từ Frontend thông qua API Gateway
        // API Gateway thường bọc body trong một chuỗi JSON
        const body = JSON.parse(event.body);
        const stockSymbol = body.stockSymbol; // Ví dụ: 'FPT', 'VCB'
        const timeFrame = body.timeFrame;     // Ví dụ: '1D', '1W'
        // TODO: Validate dữ liệu đầu vào (kiểm tra rỗng, sai định dạng...)
        if (!stockSymbol) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Thiếu mã cổ phiếu (stockSymbol)!" })
            };
        }
        // TODO: Viết logic đẩy dữ liệu này vào SQS hoặc lưu S3 (như sơ đồ kiến trúc)
        console.log(`Đang xử lý mã cổ phiếu: ${stockSymbol} với khung thời gian: ${timeFrame}`);
        // 3. Trả về kết quả cho Frontend (API Gateway yêu cầu format này)
        return {
            statusCode: 200,
            headers: {
                // Rất quan trọng để tránh lỗi CORS khi Frontend gọi API
                "Access-Control-Allow-Origin": "*", 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Đã tiếp nhận yêu cầu phân tích thành công!",
                data: { stockSymbol, status: "pending" }
            })
        };

    } catch (error) {
        console.error("Lỗi xử lý Lambda:", error);
        // Trả về lỗi 500 nếu có exception
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Lỗi hệ thống nội bộ", error: error.message })
        };
    }
};