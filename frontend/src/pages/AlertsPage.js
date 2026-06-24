/**
 * Alerts Page - AI Agent generated trading alerts
 */
import { formatVND, formatDateTime, getRecommendationColor } from '../data/mockData.js';
import { getAlerts } from '../services/apiService.js';

const strongSignalLabels = {
  BUY: 'MUA MANH',
  SELL: 'BAN MANH',
  'MUA MẠNH': 'MUA MANH',
  'BÁN MẠNH': 'BAN MANH'
};

export function renderAlertsPage(container) {
  container.innerHTML = `
    <div class="alerts-layout">
      <div class="card alert-form-card">
        <div class="card-title" style="margin-bottom:18px">AI Agent Alerts</div>
        <div class="metric-grid" style="grid-template-columns:1fr;margin-bottom:16px">
          <div class="metric-card">
            <span>Trigger source</span>
            <strong>Bedrock / Claude</strong>
          </div>
          <div class="metric-card">
            <span>Rule</span>
            <strong>BUY / SELL signal</strong>
          </div>
        </div>
        <p style="color:var(--text-muted);line-height:1.6;margin:0">
          Cảnh báo không được tạo thủ công bằng ngưỡng giá. Processing Lambda nhận kết quả từ AI Agent,
          lưu báo cáo vào DynamoDB và tự gửi SNS khi khuyến nghị thuộc nhóm tín hiệu mạnh.
        </p>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Danh sách cảnh báo AI</div>
          <div id="alerts-count" style="font-size:.8rem;color:var(--text-muted)"></div>
        </div>
        <div style="overflow-x:auto" id="alerts-table-wrapper">
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
            <span class="loading-spinner"></span>
          </div>
        </div>
      </div>
    </div>
  `;

  loadAlerts();
}

async function loadAlerts() {
  const wrapper = document.getElementById('alerts-table-wrapper');
  const countEl = document.getElementById('alerts-count');

  try {
    const alerts = await getAlerts();
    if (countEl) countEl.textContent = `${alerts.length} tín hiệu mạnh`;

    if (alerts.length === 0) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon">!</div><div class="empty-state-text">AI chưa phát hiện tín hiệu mạnh</div></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table class="alerts-table">
        <thead>
          <tr>
            <th>Mã CP</th>
            <th>Tín hiệu AI</th>
            <th>Giá hiện tại</th>
            <th>Độ tin cậy</th>
            <th>Thời điểm</th>
            <th>Lý do</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.map(renderAlertRow).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon">!</div><div class="empty-state-text">${err.message}</div></div>`;
  }
}

function renderAlertRow(alert) {
  const rec = alert.recommendation || 'HOLD';
  const rc = getRecommendationColor(rec);
  const signalLabel = strongSignalLabels[rec] || rec;

  return `
    <tr id="alert-row-${alert.alertId}">
      <td>
        <strong>${alert.stockSymbol}</strong>
        <div style="color:var(--text-muted);font-size:.78rem">${alert.companyName || ''}</div>
      </td>
      <td>
        <span class="rec-badge rec-${rec}" style="border-color:${rc.border};color:${rc.text};background:${rc.bg}">
          ${signalLabel}
        </span>
      </td>
      <td style="font-weight:600">${formatVND(alert.currentPrice)} VND</td>
      <td><span class="status-badge status-SENT">${alert.confidenceScore || '--'}%</span></td>
      <td style="color:var(--text-muted);font-size:.82rem">${formatDateTime(alert.createdAt)}</td>
      <td style="min-width:280px">${alert.triggerReason}</td>
    </tr>
  `;
}
