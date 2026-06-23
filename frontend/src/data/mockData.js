/**
 * Mock Data Layer
 * Dựa trên cấu trúc JSON trong ThietKeHeThong_BE.md
 * Sau này sẽ được thay thế bằng API calls thật
 */

// ============================================================
// Helper: Tạo dữ liệu lịch sử giá ngẫu nhiên
// ============================================================
function generatePriceHistory(basePrice, days = 30, volatility = 0.02) {
  const history = [];
  let price = basePrice * (1 - volatility * days * 0.3);
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * basePrice * volatility;
    price = Math.max(price + change, basePrice * 0.7);
    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(price - Math.random() * 500),
      high: Math.round(price + Math.random() * 1000),
      low: Math.round(price - Math.random() * 1000),
      close: Math.round(price),
      volume: Math.round(500000 + Math.random() * 2000000)
    });
  }
  return history;
}

// ============================================================
// Mock Reports - API 1.2 GET /api/reports
// ============================================================
export const mockReports = {
  FPT: {
    stockSymbol: "FPT",
    companyName: "FPT Corporation",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 132000,
    previousClose: 129500,
    change: 2500,
    changePercent: 1.93,
    indicators: {
      rsi: 62.5,
      ma20: 128500,
      ma50: 125000
    },
    aiAnalysis: {
      recommendation: "BUY",
      reasoning: "RSI đang ở vùng tích cực (62.5), đường giá nằm trên MA20 và MA50 xác nhận xu hướng tăng ngắn hạn. Khối lượng giao dịch tăng mạnh so với phiên trước cho thấy dòng tiền đang đổ vào mã này. Khuyến nghị tích lũy cổ phiếu quanh vùng giá hiện tại."
    },
    priceHistory: generatePriceHistory(132000)
  },
  VNM: {
    stockSymbol: "VNM",
    companyName: "Vinamilk",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 72500,
    previousClose: 73200,
    change: -700,
    changePercent: -0.96,
    indicators: {
      rsi: 44.2,
      ma20: 73800,
      ma50: 74500
    },
    aiAnalysis: {
      recommendation: "HOLD",
      reasoning: "RSI ở vùng trung tính (44.2), giá đang test vùng hỗ trợ MA20. Cần chờ tín hiệu rõ ràng hơn trước khi hành động. Nên giữ nguyên vị thế hiện tại và quan sát phản ứng giá tại vùng MA50."
    },
    priceHistory: generatePriceHistory(72500)
  },
  VIC: {
    stockSymbol: "VIC",
    companyName: "Vingroup",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 43500,
    previousClose: 44800,
    change: -1300,
    changePercent: -2.9,
    indicators: {
      rsi: 31.8,
      ma20: 45200,
      ma50: 46800
    },
    aiAnalysis: {
      recommendation: "SELL",
      reasoning: "RSI tiệm cận vùng quá bán (31.8), giá đã phá vỡ hỗ trợ MA20 và đang hướng về MA50. Áp lực bán mạnh với khối lượng lớn. Khuyến nghị cắt lỗ nếu giá xuống dưới 43.000 VND."
    },
    priceHistory: generatePriceHistory(43500)
  },
  HPG: {
    stockSymbol: "HPG",
    companyName: "Hòa Phát Group",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 28500,
    previousClose: 27800,
    change: 700,
    changePercent: 2.52,
    indicators: {
      rsi: 58.3,
      ma20: 27200,
      ma50: 26800
    },
    aiAnalysis: {
      recommendation: "BUY",
      reasoning: "RSI đang tăng tốt (58.3), giá vượt MA20 với khối lượng tăng. Tín hiệu golden cross (MA20 cắt lên MA50) sắp hình thành. Đây là cơ hội mua vào tốt cho vị thế trung hạn."
    },
    priceHistory: generatePriceHistory(28500)
  },
  MWG: {
    stockSymbol: "MWG",
    companyName: "Thế Giới Di Động",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 56200,
    previousClose: 55800,
    change: 400,
    changePercent: 0.72,
    indicators: {
      rsi: 51.7,
      ma20: 55500,
      ma50: 54200
    },
    aiAnalysis: {
      recommendation: "HOLD",
      reasoning: "RSI trung tính (51.7), giá sideway quanh vùng MA20. Chưa có tín hiệu breakout rõ ràng. Khuyến nghị chờ đợi tín hiệu mạnh hơn trước khi mở vị thế mới."
    },
    priceHistory: generatePriceHistory(56200)
  },
  VCB: {
    stockSymbol: "VCB",
    companyName: "Vietcombank",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 96800,
    previousClose: 95200,
    change: 1600,
    changePercent: 1.68,
    indicators: {
      rsi: 67.1,
      ma20: 94500,
      ma50: 92000
    },
    aiAnalysis: {
      recommendation: "BUY",
      reasoning: "RSI tích cực (67.1) nhưng chưa quá mua, giá vượt cả MA20 và MA50 với xu hướng tăng ổn định. Dòng tiền từ khối ngoại vào mạnh. Đây là mã blue-chip đáng để tích lũy dài hạn."
    },
    priceHistory: generatePriceHistory(96800)
  },
  TCB: {
    stockSymbol: "TCB",
    companyName: "Techcombank",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 47300,
    previousClose: 48100,
    change: -800,
    changePercent: -1.66,
    indicators: {
      rsi: 39.5,
      ma20: 48500,
      ma50: 49200
    },
    aiAnalysis: {
      recommendation: "HOLD",
      reasoning: "RSI giảm về vùng yếu (39.5), giá dưới cả MA20 và MA50 cho thấy xu hướng giảm ngắn hạn. Tuy nhiên vùng hỗ trợ mạnh tại 46.500. Nên chờ tín hiệu phục hồi trước khi hành động."
    },
    priceHistory: generatePriceHistory(47300)
  },
  MSN: {
    stockSymbol: "MSN",
    companyName: "Masan Group",
    timeFrame: "1D",
    timestamp: "2026-06-23T03:30:00.000Z",
    currentPrice: 88500,
    previousClose: 86200,
    change: 2300,
    changePercent: 2.67,
    indicators: {
      rsi: 71.2,
      ma20: 85000,
      ma50: 82500
    },
    aiAnalysis: {
      recommendation: "BUY",
      reasoning: "RSI mạnh (71.2) nhưng cần lưu ý vùng quá mua, giá tăng breakout khỏi MA20 với volume đột biến. Tin tức tích cực về kế hoạch IPO WinMart hỗ trợ đà tăng. Có thể mua vào nhưng nên đặt stoploss tại MA20."
    },
    priceHistory: generatePriceHistory(88500)
  }
};

// ============================================================
// Mock Alerts - API 1.3, 1.4 GET /api/alerts
// ============================================================
export const mockAlerts = [
  {
    alertId: "alert-a1b2c3d4",
    stockSymbol: "FPT",
    targetPrice: 140000,
    condition: "ABOVE",
    status: "ACTIVE",
    email: "phuc@example.com",
    createdAt: "2026-06-23T03:25:00.000Z"
  },
  {
    alertId: "alert-e5f6g7h8",
    stockSymbol: "VIC",
    targetPrice: 42000,
    condition: "BELOW",
    status: "ACTIVE",
    email: "phuc@example.com",
    createdAt: "2026-06-22T10:15:00.000Z"
  },
  {
    alertId: "alert-i9j0k1l2",
    stockSymbol: "HPG",
    targetPrice: 30000,
    condition: "ABOVE",
    status: "TRIGGERED",
    email: "phuc@example.com",
    createdAt: "2026-06-20T08:00:00.000Z"
  },
  {
    alertId: "alert-m3n4o5p6",
    stockSymbol: "VCB",
    targetPrice: 100000,
    condition: "ABOVE",
    status: "ACTIVE",
    email: "phuc@example.com",
    createdAt: "2026-06-21T14:30:00.000Z"
  },
  {
    alertId: "alert-q7r8s9t0",
    stockSymbol: "MSN",
    targetPrice: 80000,
    condition: "BELOW",
    status: "TRIGGERED",
    email: "phuc@example.com",
    createdAt: "2026-06-19T09:45:00.000Z"
  }
];

// ============================================================
// Mock Market Summary
// ============================================================
export const mockMarketSummary = {
  vnIndex: { value: 1285.6, change: 12.3, changePercent: 0.97 },
  hnxIndex: { value: 232.8, change: -1.5, changePercent: -0.64 },
  upcomIndex: { value: 95.4, change: 0.8, changePercent: 0.85 },
  totalVolume: "856.2M",
  totalValue: "18.5T VND",
  advancers: 245,
  decliners: 178,
  unchanged: 89
};

// ============================================================
// Danh sách mã cổ phiếu có sẵn
// ============================================================
export const availableStocks = Object.keys(mockReports);

// ============================================================
// Helper: Lấy màu theo recommendation
// ============================================================
export function getRecommendationColor(rec) {
  switch (rec) {
    case 'BUY': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' };
    case 'SELL': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' };
    case 'HOLD': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' };
    default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: '#94a3b8' };
  }
}

// ============================================================
// Helper: Format tiền VND
// ============================================================
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

// ============================================================
// Helper: Format phần trăm
// ============================================================
export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ============================================================
// Helper: Format ngày giờ
// ============================================================
export function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
