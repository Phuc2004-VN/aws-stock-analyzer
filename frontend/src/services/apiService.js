/**
 * API Service Layer
 * Hiện tại dùng mock data, sau swap sang real API endpoints
 */
import { mockReports, mockAlerts } from '../data/mockData.js';

// Base URL - sẽ thay đổi khi có API Gateway thật
const API_BASE = import.meta.env.VITE_API_BASE || '';

// Biến lưu alerts có thể thay đổi (thêm/xóa)
let localAlerts = [...mockAlerts];

/**
 * API 1.1 - POST /api/analyze
 * Gửi yêu cầu phân tích cổ phiếu
 */
export async function submitAnalysis(stockSymbol, timeFrame) {
  // Mock: Giả lập delay API
  await new Promise(r => setTimeout(r, 800));

  if (!stockSymbol || !timeFrame) {
    throw new Error('Thiếu thông tin mã cổ phiếu hoặc khung thời gian.');
  }

  return {
    message: "Đã tiếp nhận yêu cầu phân tích thành công",
    data: {
      stockSymbol: stockSymbol.toUpperCase(),
      timeFrame,
      timestamp: new Date().toISOString(),
      status: "PENDING"
    }
  };
}

/**
 * API 1.2 - GET /api/reports?symbol=X&timeframe=Y
 * Lấy kết quả phân tích
 */
export async function getReport(symbol, timeframe = '1D') {
  await new Promise(r => setTimeout(r, 500));

  const report = mockReports[symbol.toUpperCase()];
  if (!report) {
    throw new Error('Không tìm thấy dữ liệu phân tích cho mã cổ phiếu yêu cầu.');
  }

  return { ...report, timeFrame: timeframe };
}

/**
 * API 1.2 - Lấy tất cả reports
 */
export async function getAllReports() {
  await new Promise(r => setTimeout(r, 300));
  return Object.values(mockReports);
}

/**
 * API 1.3 - POST /api/alerts
 * Đăng ký cảnh báo giá
 */
export async function createAlert(alertData) {
  await new Promise(r => setTimeout(r, 600));

  const newAlert = {
    alertId: `alert-${Date.now().toString(36)}`,
    stockSymbol: alertData.stockSymbol.toUpperCase(),
    targetPrice: alertData.targetPrice,
    condition: alertData.condition,
    status: "ACTIVE",
    email: alertData.email,
    createdAt: new Date().toISOString()
  };

  localAlerts.unshift(newAlert);
  return newAlert;
}

/**
 * API 1.4 - GET /api/alerts?email=X
 * Lấy danh sách cảnh báo
 */
export async function getAlerts(email) {
  await new Promise(r => setTimeout(r, 400));
  return [...localAlerts];
}

/**
 * API 1.5 - DELETE /api/alerts/{alertId}
 * Xóa cảnh báo
 */
export async function deleteAlert(alertId) {
  await new Promise(r => setTimeout(r, 400));

  const index = localAlerts.findIndex(a => a.alertId === alertId);
  if (index === -1) {
    throw new Error('Không tìm thấy cảnh báo.');
  }

  localAlerts.splice(index, 1);
  return { message: "Đã xóa cảnh báo thành công" };
}
