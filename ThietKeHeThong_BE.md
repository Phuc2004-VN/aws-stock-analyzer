# Tài liệu Thiết kế API & Cơ sở dữ liệu (Backend)

Hệ thống phân tích kỹ thuật và cảnh báo giá cổ phiếu tự động sử dụng AWS Services.
Tài liệu này dùng để thống nhất giao tiếp giữa Frontend và Backend/Infrastructure.

---

## 1. Thiết kế API (API Specifications)

Hệ thống giao tiếp thông qua **API Gateway** với các endpoint sau:

### 1.1. Gửi yêu cầu phân tích cổ phiếu (Ingestion API)

* **Endpoint:** `/api/analyze`
* **Method:** `POST`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <Cognito_ID_Token>` (nếu cấu hình Auth)
* **Request Body:**
  ```json
  {
    "stockSymbol": "FPT",
    "timeFrame": "1D"
  }
  ```
  *Ghi chú: `timeFrame` hỗ trợ các giá trị: `1D` (1 ngày), `1W` (1 tuần), `1M` (1 tháng).*
* **Response (200 OK):**
  ```json
  {
    "message": "Đã tiếp nhận yêu cầu phân tích thành công",
    "data": {
      "stockSymbol": "FPT",
      "timeFrame": "1D",
      "timestamp": "2026-06-23T03:22:00.000Z",
      "status": "PENDING"
    }
  }
  ```

---

### 1.2. Lấy kết quả phân tích kỹ thuật và khuyến nghị AI (Reports API)

* **Endpoint:** `/api/reports`
* **Method:** `GET`
* **Query Parameters:**
  * `symbol` (bắt buộc) - Ví dụ: `FPT`
  * `timeframe` (tùy chọn, mặc định `1D`) - Ví dụ: `1D`
* **Response (200 OK):**
  ```json
  {
    "stockSymbol": "FPT",
    "timeFrame": "1D",
    "timestamp": "2026-06-23T03:30:00.000Z",
    "currentPrice": 132000,
    "indicators": {
      "rsi": 62.5,
      "ma20": 128500,
      "ma50": 125000
    },
    "aiAnalysis": {
      "recommendation": "BUY",
      "confidence_score": 82,
      "reasoning_trace": "RSI đang ở vùng tích cực, giá nằm trên MA20 và MA50..."
    }
  }
  ```

---

### 1.3. Lấy danh sách cảnh báo do AI Agent tự sinh (AI Alerts API)

Cảnh báo giá **không được tạo thủ công** bằng form nhập ngưỡng giá. Processing Lambda tự tạo cảnh báo khi Bedrock/Claude trả về tín hiệu mạnh như `BUY`, `SELL`, `MUA MẠNH`, hoặc `BÁN MẠNH`.

* **Endpoint:** `/api/alerts`
* **Method:** `GET`
* **Query Parameters:**
  * `symbol` (tùy chọn) - Lọc theo mã cổ phiếu.
  * `from` / `to` (tùy chọn) - Khoảng thời gian ISO nếu cần xem lịch sử.
* **Response (200 OK):**
  ```json
  [
    {
      "alertId": "AI#FPT#2026-06-23T03:30:00.000Z",
      "stockSymbol": "FPT",
      "timestamp": "2026-06-23T03:30:00.000Z",
      "currentPrice": 132000,
      "recommendation": "BUY",
      "confidenceScore": 82,
      "reasoning": "RSI đang ở vùng tích cực, giá nằm trên MA20 và MA50...",
      "source": "AI_AGENT",
      "status": "SENT"
    }
  ]
  ```

---

## 2. Thiết kế Cơ sở dữ liệu (DynamoDB Schema Design)

Dữ liệu sẽ được lưu trữ trong **DynamoDB** nhằm đảm bảo tốc độ đọc/ghi nhanh và khả năng tự động co giãn.

### 2.1. Bảng `StockReports` (Lưu lịch sử báo cáo phân tích)

* **Partition Key (PK):** `stockSymbol` (String) - Ví dụ: `FPT`
* **Sort Key (SK):** `timeFrame#timestamp` (String) - Ví dụ: `1D#2026-06-23T03:30:00.000Z`
* **Attributes:**
  * `currentPrice` (Number)
  * `indicators` (Map): `{ rsi: 62.5, ma20: 128500, ma50: 125000 }`
  * `aiAnalysis` (Map): `{ recommendation, confidence_score, reasoning_trace, citations }`

### 2.2. Bảng `StockAlerts` (Lưu cảnh báo do AI Agent tự sinh)

* **Partition Key (PK):** `alertId` (String) - Ví dụ: `AI#FPT#2026-06-23T03:30:00.000Z`
* **Attributes:**
  * `stockSymbol` (String)
  * `stockTimestamp` (String) - Ví dụ: `FPT#2026-06-23T03:30:00.000Z`
  * `timestamp` (String)
  * `currentPrice` (Number)
  * `recommendation` (String) - `BUY`, `SELL`, `MUA MẠNH`, hoặc `BÁN MẠNH`
  * `confidenceScore` (Number)
  * `reasoning` (String)
  * `source` (String) - `AI_AGENT`
  * `status` (String) - `SENT` hoặc `FAILED`
* **Global Secondary Index (GSI):** `GSI_StockTimestamp`
  * **Partition Key:** `stockSymbol` (String)
  * **Sort Key:** `timestamp` (String)
  * *Mục đích:* Frontend truy vấn nhanh lịch sử cảnh báo AI theo từng mã cổ phiếu.
