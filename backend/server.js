const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Mở cửa sổ cho Frontend gọi vào
app.use(express.json()); // Cho phép đọc dữ liệu JSON Lực gửi lên

// Import các hàm Lambda của bạn
const ingestion = require('./ingestion-lambda/index.js');
const reports = require('./reports-lambda/index.js');
const alerts = require('./alerts-lambda/index.js');

// Hàm "phép thuật": Biến request của Express thành định dạng Event của AWS Lambda
const createEvent = (req) => ({
    httpMethod: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
    queryStringParameters: req.query,
    pathParameters: req.params
});

// API 1.1: Tiếp nhận yêu cầu
app.post('/api/analyze', async (req, res) => {
    const result = await ingestion.handler(createEvent(req));
    res.status(result.statusCode).set(result.headers).send(result.body);
});

// API 1.2: Lấy báo cáo
app.get('/api/reports', async (req, res) => {
    const result = await reports.handler(createEvent(req));
    res.status(result.statusCode).set(result.headers).send(result.body);
});

// API 1.3, 1.4: Tạo và lấy danh sách cảnh báo
app.all('/api/alerts', async (req, res) => {
    const result = await alerts.handler(createEvent(req));
    res.status(result.statusCode).set(result.headers).send(result.body);
});

// API 1.5: Xóa cảnh báo
app.delete('/api/alerts/:alertId', async (req, res) => {
    const result = await alerts.handler(createEvent(req));
    res.status(result.statusCode).set(result.headers).send(result.body);
});

// Bật server
app.listen(3000, () => {
    console.log("Server giả lập AWS API Gateway đang chạy tại: http://localhost:3000");
});
