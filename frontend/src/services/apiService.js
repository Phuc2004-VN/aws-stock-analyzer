/**
 * API Service Layer
 * Uses API Gateway when VITE_API_BASE is configured, otherwise falls back to mock data.
 */
import { mockReports, mockAlerts } from '../data/mockData.js';
import { getAuthToken } from './authService.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const LOCAL_FAKE_TOKEN = import.meta.env.VITE_FAKE_TOKEN || 'fake-local-token-from-frontend';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken() || LOCAL_FAKE_TOKEN}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || `API error ${response.status}`);
  }

  return payload;
}

export async function submitAnalysis(stockSymbol, timeFrame) {
  if (!stockSymbol || !timeFrame) {
    throw new Error('Thiếu thông tin mã cổ phiếu hoặc khung thời gian.');
  }

  if (API_BASE) {
    return requestJson('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ stockSymbol, timeFrame })
    });
  }

  await new Promise(r => setTimeout(r, 800));
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

export async function getReport(symbol, timeframe = '1D') {
  if (API_BASE) {
    return requestJson(`/api/reports?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
  }

  await new Promise(r => setTimeout(r, 500));
  const report = mockReports[symbol.toUpperCase()];
  if (!report) {
    throw new Error('Không tìm thấy dữ liệu phân tích cho mã cổ phiếu yêu cầu.');
  }

  return { ...report, timeFrame: timeframe };
}

export async function getAllReports() {
  if (API_BASE) {
    const payload = await requestJson('/api/reports');
    return Array.isArray(payload) ? payload : payload.items || [];
  }

  await new Promise(r => setTimeout(r, 300));
  return Object.values(mockReports);
}

export async function getAlerts(symbol = '') {
  if (API_BASE) {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    const payload = await requestJson(`/api/alerts${query}`);
    return Array.isArray(payload) ? payload : payload.items || [];
  }

  await new Promise(r => setTimeout(r, 400));
  return [...mockAlerts];
}
