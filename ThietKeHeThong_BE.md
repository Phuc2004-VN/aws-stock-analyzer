# Tài liệu Thiết kế API & Cơ sở dữ liệu (Backend)

Hệ thống phân tích kỹ thuật và cảnh báo giá cổ phiếu tự động sử dụng AWS Services.
Tài liệu này dùng để thống nhất giao tiếp giữa Frontend và Backend/Infrastructure.

---

## 1. Thiết kế API (API Specifications)
Hệ thống giao tiếp thông qua **API Gateway** với các endpoint sau:

### 1.1. Gửi yêu cầu phân tích cổ phiếu (Ingestion API)
*   **Endpoint:** `/api/analyze`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <Cognito_ID_Token>` (nếu cấu hình Auth)
*   **Request Body:**
    ```json
    {
      "stockSymbol": "FPT",
      "timeFrame": "1D"
    }
    ```
    *Ghi chú: `timeFrame` hỗ trợ các giá trị: `1D` (1 ngày), `1W` (1 tuần), `1M` (1 tháng).*
*   **Response (200 OK):**
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
*   **Response (400 Bad Request):**
    ```json
    {
      "message": "Thiếu thông tin mã cổ phiếu hoặc khung thời gian."
    }
    ```

---

### 1.2. Lấy kết quả phân tích kỹ thuật và khuyến nghị AI (Reports API)
*   **Endpoint:** `/api/reports`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `symbol` (bắt buộc) - Ví dụ: `FPT`
    *   `timeframe` (tùy chọn, mặc định `1D`) - Ví dụ: `1D`
*   **Response (200 OK):**
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
        "reasoning": "RSI đang ở vùng tích cực (62.5), đường giá nằm trên MA20 và MA50 xác nhận xu hướng tăng ngắn hạn. Khuyên nghị tích lũy cổ phiếu quanh vùng giá hiện tại."
      }
    }
    ```
*   **Response (404 Not Found):**
    ```json
    {
      "message": "Không tìm thấy dữ liệu phân tích cho mã cổ phiếu yêu cầu."
    }
    ```

---

### 1.3. Đăng ký cảnh báo giá (Alerts API)
*   **Endpoint:** `/api/alerts`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "stockSymbol": "FPT",
      "targetPrice": 140000,
      "condition": "ABOVE",
      "email": "phuc@example.com"
    }
    ```
    *Ghi chú: `condition` nhận giá trị `ABOVE` (vượt trên) hoặc `BELOW` (giảm dưới).*
*   **Response (201 Created):**
    ```json
    {
      "alertId": "alert-uuid-12345",
      "stockSymbol": "FPT",
      "targetPrice": 140000,
      "condition": "ABOVE",
      "status": "ACTIVE",
      "email": "phuc@example.com",
      "createdAt": "2026-06-23T03:25:00.000Z"
    }
    ```

---

### 1.4. Lấy danh sách cảnh báo của người dùng
*   **Endpoint:** `/api/alerts`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `email` (bắt buộc) - Email người dùng dùng để nhận cảnh báo.
*   **Response (200 OK):**
    ```json
    [
      {
        "alertId": "alert-uuid-12345",
        "stockSymbol": "FPT",
        "targetPrice": 140000,
        "condition": "ABOVE",
        "status": "ACTIVE",
        "email": "phuc@example.com",
        "createdAt": "2026-06-23T03:25:00.000Z"
      }
    ]
    ```

---

### 1.5. Xóa cảnh báo giá
*   **Endpoint:** `/api/alerts/{alertId}`
*   **Method:** `DELETE`
*   **Response (200 OK):**
    ```json
    {
      "message": "Đã xóa cảnh báo thành công"
    }
    ```

---

## 2. Thiết kế Cơ sở dữ liệu (DynamoDB Schema Design)
Dữ liệu sẽ được lưu trữ trong **DynamoDB** nhằm đảm bảo tốc độ đọc/ghi nhanh và khả năng tự động co giãn.

### 2.1. Bảng `StockReports` (Lưu lịch sử báo cáo phân tích)
*   **Partition Key (PK):** `stockSymbol` (String) - Ví dụ: `FPT`
*   **Sort Key (SK):** `timeFrame#timestamp` (String) - Ví dụ: `1D#2026-06-23T03:30:00.000Z`
*   **Attributes:**
    *   `currentPrice` (Number)
    *   `indicators` (Map): `{ rsi: 62.5, ma20: 128500, ma50: 125000 }`
    *   `aiAnalysis` (Map): `{ recommendation: "BUY", reasoning: "..." }`

### 2.2. Bảng `StockAlerts` (Lưu thông tin cảnh báo cài đặt bởi người dùng)
*   **Partition Key (PK):** `alertId` (String) - UUID ngẫu nhiên của cảnh báo.
*   **Attributes:**
    *   `stockSymbol` (String)
    *   `targetPrice` (Number)
    *   `condition` (String) - `ABOVE` hoặc `BELOW`
    *   `status` (String) - `ACTIVE` hoặc `TRIGGERED`
    *   `email` (String)
    *   `createdAt` (String)
*   **Global Secondary Index (GSI):** `GSI_StockSymbol`
    *   **Partition Key:** `stockSymbol` (String)
    *   **Sort Key:** `status` (String)
    *   *Mục đích:* Dùng để Processing Lambda truy vấn nhanh các cảnh báo có trạng thái `ACTIVE` của một mã cổ phiếu vừa có cập nhật giá mới (`dbService.getActiveAlertsForSymbol(stockSymbol)`).
