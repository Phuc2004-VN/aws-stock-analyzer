/**
 * Dashboard Page - Trang tổng quan thị trường
 */
import { mockReports, mockMarketSummary, formatVND, formatPercent, getRecommendationColor } from '../data/mockData.js';

export function renderDashboardPage(container) {
  const ms = mockMarketSummary;
  const reports = Object.values(mockReports);

  container.innerHTML = `
    <!-- Market Overview Stats -->
    <div class="market-overview">
      <div class="market-stat">
        <div class="market-stat-label">VN-Index</div>
        <div class="market-stat-value ${ms.vnIndex.change >= 0 ? 'positive' : 'negative'}">${ms.vnIndex.value.toLocaleString('vi-VN')}</div>
        <div class="market-stat-change ${ms.vnIndex.change >= 0 ? 'positive' : 'negative'}">${ms.vnIndex.change >= 0 ? '▲' : '▼'} ${Math.abs(ms.vnIndex.changePercent)}%</div>
      </div>
      <div class="market-stat">
        <div class="market-stat-label">Tăng / Giảm</div>
        <div class="market-stat-value"><span class="positive">${ms.advancers}</span> / <span class="negative">${ms.decliners}</span></div>
        <div class="market-stat-change" style="color:var(--text-muted)">${ms.unchanged} đứng giá</div>
      </div>
      <div class="market-stat">
        <div class="market-stat-label">Khối lượng</div>
        <div class="market-stat-value" style="color:var(--accent-cyan)">${ms.totalVolume}</div>
        <div class="market-stat-change" style="color:var(--text-muted)">cổ phiếu</div>
      </div>
      <div class="market-stat">
        <div class="market-stat-label">Giá trị GD</div>
        <div class="market-stat-value" style="color:var(--yellow)">${ms.totalValue}</div>
        <div class="market-stat-change" style="color:var(--text-muted)">tổng sàn</div>
      </div>
    </div>

    <!-- Section Header -->
    <div class="section-header">
      <div>
        <div class="section-title">Cổ phiếu đang theo dõi</div>
        <div class="section-subtitle">Dữ liệu phân tích mới nhất từ AI</div>
      </div>
    </div>

    <!-- Stock Cards Grid -->
    <div class="stock-grid" id="stock-grid"></div>

    <!-- Summary Table -->
    <div class="card" style="margin-top:8px">
      <div class="card-header">
        <div class="card-title">📋 Bảng tổng hợp chỉ số kỹ thuật</div>
      </div>
      <div style="overflow-x:auto">
        <table class="alerts-table">
          <thead>
            <tr>
              <th>Mã CP</th>
              <th>Giá hiện tại</th>
              <th>Thay đổi</th>
              <th>RSI</th>
              <th>MA20</th>
              <th>MA50</th>
              <th>AI</th>
            </tr>
          </thead>
          <tbody id="summary-table-body"></tbody>
        </table>
      </div>
    </div>
  `;

  // Render stock cards
  const grid = document.getElementById('stock-grid');
  reports.forEach(report => {
    const isPositive = report.change >= 0;
    const recColor = getRecommendationColor(report.aiAnalysis.recommendation);
    
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.id = `stock-card-${report.stockSymbol}`;
    card.innerHTML = `
      <div class="stock-card-top">
        <div>
          <div class="stock-symbol">${report.stockSymbol}</div>
          <div class="stock-name">${report.companyName}</div>
        </div>
        <span class="rec-badge rec-${report.aiAnalysis.recommendation}">${report.aiAnalysis.recommendation}</span>
      </div>
      <div class="stock-price ${isPositive ? 'positive' : 'negative'}">${formatVND(report.currentPrice)}</div>
      <div class="stock-change ${isPositive ? 'positive' : 'negative'}">
        ${isPositive ? '▲' : '▼'} ${formatVND(Math.abs(report.change))} (${formatPercent(report.changePercent)})
      </div>
      <div class="mini-chart-container">
        <canvas id="mini-chart-${report.stockSymbol}" width="260" height="50"></canvas>
      </div>
      <div class="stock-indicators">
        <div class="indicator-mini">
          <div class="indicator-mini-label">RSI</div>
          <div class="indicator-mini-value" style="color:${report.indicators.rsi > 70 ? 'var(--red)' : report.indicators.rsi < 30 ? 'var(--green)' : 'var(--text-primary)'}">${report.indicators.rsi}</div>
        </div>
        <div class="indicator-mini">
          <div class="indicator-mini-label">MA20</div>
          <div class="indicator-mini-value">${formatVND(report.indicators.ma20)}</div>
        </div>
        <div class="indicator-mini">
          <div class="indicator-mini-label">MA50</div>
          <div class="indicator-mini-value">${formatVND(report.indicators.ma50)}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => window.navigateToAnalysis(report.stockSymbol));
    grid.appendChild(card);

    // Draw mini sparkline
    requestAnimationFrame(() => drawMiniChart(report));
  });

  // Render summary table
  const tbody = document.getElementById('summary-table-body');
  reports.forEach(r => {
    const isP = r.change >= 0;
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.innerHTML = `
      <td><strong>${r.stockSymbol}</strong> <span style="color:var(--text-muted);font-size:0.75rem">${r.companyName}</span></td>
      <td class="${isP ? 'positive' : 'negative'}" style="font-weight:600">${formatVND(r.currentPrice)}</td>
      <td class="${isP ? 'positive' : 'negative'}">${isP ? '▲' : '▼'} ${formatPercent(r.changePercent)}</td>
      <td style="color:${r.indicators.rsi > 70 ? 'var(--red)' : r.indicators.rsi < 30 ? 'var(--green)' : 'var(--accent-cyan)'}">${r.indicators.rsi}</td>
      <td>${formatVND(r.indicators.ma20)}</td>
      <td>${formatVND(r.indicators.ma50)}</td>
      <td><span class="rec-badge rec-${r.aiAnalysis.recommendation}">${r.aiAnalysis.recommendation}</span></td>
    `;
    row.addEventListener('click', () => window.navigateToAnalysis(r.stockSymbol));
    tbody.appendChild(row);
  });
}

function drawMiniChart(report) {
  const canvas = document.getElementById(`mini-chart-${report.stockSymbol}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prices = report.priceHistory.map(p => p.close);
  const last7 = prices.slice(-10);

  const w = canvas.width;
  const h = canvas.height;
  const min = Math.min(...last7);
  const max = Math.max(...last7);
  const range = max - min || 1;

  ctx.clearRect(0, 0, w, h);
  
  const isPositive = report.change >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  // Line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  last7.forEach((p, i) => {
    const x = (i / (last7.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 8) - 4;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gradient fill
  const lastX = w;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.lineTo(lastX, h);
  ctx.lineTo(0, h);
  ctx.fillStyle = gradient;
  ctx.fill();
}
