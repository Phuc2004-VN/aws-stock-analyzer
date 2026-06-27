/**
 * Server giả lập AWS API Gateway cho môi trường Local
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Ingestion Lambda
const ingestionLambda = require('./ingestion-lambda/index');

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// SỬA LỖI Ở ĐÂY: Dùng app.use() thay cho app.all('*') để tương thích với Express v5
app.use(async (req, res) => {
    // Giả lập đối tượng `event` chuẩn cấu trúc của AWS Lambda
    const event = {
        path: req.path,                            
        httpMethod: req.method,                    
        headers: req.headers,                      
        // Thêm điều kiện check an toàn để tránh lỗi undefined
        body: (req.body && Object.keys(req.body).length > 0) ? JSON.stringify(req.body) : null,
        queryStringParameters: (req.query && Object.keys(req.query).length > 0) ? req.query : null,          
        pathParameters: req.params
    };

    try {
        // Gọi hàm handler của Ingestion Lambda và đợi kết quả
        const result = await ingestionLambda.handler(event);
        
        // Trả dữ liệu ngược lại cho Frontend
        res.status(result.statusCode || 200)
           .set(result.headers || {})
           .send(result.body);

    } catch (error) {
        console.error("Lỗi giả lập API Gateway:", error);
        res.status(500).json({ 
            message: "Lỗi giả lập API Gateway nội bộ", 
            error: error.message 
        });
    }
});

// Khởi chạy Server ở cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Server giả lập AWS API Gateway đang chạy tại: http://localhost:${PORT}`);
    console.log(`Đang chạy chế độ Local - Bỏ qua xác thực Cognito!`);
    console.log(`==================================================`);
});