# Hệ Thống Phân Tích Kỹ Thuật & Cảnh Báo Giá Cổ Phiếu

## Đội ngũ phát triển
* **Frontend & Backend:** Phúc, Lực
* **Cloud Infrastructure (AWS):** Nam, Thiên
* **QA/Tester:** Kiệt

## Cấu trúc Repository (Monorepo)
* `/frontend`: Chứa mã nguồn giao diện Dashboard.
* `/backend/ingestion-lambda`: Mã nguồn Node.js xử lý dữ liệu đầu vào từ API Gateway.
* `/backend/processing-lambda`: Mã nguồn Node.js xử lý stream dữ liệu từ SQS, giao tiếp AI Bedrock và lưu DynamoDB.