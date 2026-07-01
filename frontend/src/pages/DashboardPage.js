/**
 * Dashboard Page - Market command center
 */
import { formatVND, formatPercent } from '../data/mockData.js';
import { getAllReports, getMarketSummary } from '../services/apiService.js';

const sectorMap = {
  FPT: { sector: 'Công nghệ', weight: 18.5 },
  VNM: { sector: 'Tiêu dùng', weight: 14.2 },
  VIC: { sector: 'Bất động sản', weight: 12.8 },
  HPG: { sector: 'Nguyên vật liệu', weight: 11.6 },
  MWG: { sector: 'Bán lẻ', weight: 9.7 },
  VCB: { sector: 'Ngân hàng', weight: 21.4 },
  TCB: { sector: 'Ngân hàng', weight: 16.9 },
  MSN: { sector: 'Tiêu dùng', weight: 13.3 }
};

const fundamentals = {
  FPT: { pe: 21.8, eps: 6055, beta: 0.86, foreign: '+84B' },
  VNM: { pe: 16.2, eps: 4475, beta: 0.62, foreign: '-12B' },
  VIC: { pe: 34.5, eps: 1261, beta: 1.31, foreign: '-46B' },
  HPG: { pe: 13.4, eps: 2127, beta: 1.18, foreign: '+33B' },
  MWG: { pe: 28.7, eps: 1958, beta: 1.08, foreign: '+9B' },
  VCB: { pe: 18.9, eps: 5122, beta: 0.74, foreign: '+126B' },
  TCB: { pe: 9.8, eps: 4827, beta: 0.91, foreign: '-21B' },
  MSN: { pe: 45.2, eps: 1958, beta: 1.22, foreign: '+17B' }
};

const sectorPerformance = [
  { name: 'Ngân hàng', value: 1.24, breadth: '12 tăng / 5 giảm' },
  { name: 'Công nghệ', value: 2.12, breadth: '6 tăng / 1 giảm' },
  { name: 'Bán lẻ', value: 0.68, breadth: '8 tăng / 7 giảm' },
  { name: 'Tiêu dùng', value: -0.42, breadth: '5 tăng / 9 giảm' },
  { name: 'Thép', value: 1.76, breadth: '9 tăng / 3 giảm' },
  { name: 'Bất động sản', value: -1.08, breadth: '7 tăng / 18 giảm' }
];

export function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="card" style="text-align:center;padding:42px">
      <span class="loading-spinner"></span>
    </div>
  `;

  loadDashboard(container);
}

async function loadDashboard(container) {
  let ms;
  let reports;

  try {
    [ms, reports] = await Promise.all([getMarketSummary(), getAllReports()]);
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">!</div><div class="empty-state-text">${error.message}</div></div>`;
    return;
  }

  const buyCount = reports.filter(r => r.aiAnalysis.recommendation === 'BUY').length;
  const holdCount = reports.filter(r => r.aiAnalysis.recommendation === 'HOLD').length;
  const sellCount = reports.filter(r => r.aiAnalysis.recommendation === 'SELL').length;
  const totalBreadth = ms.advancers + ms.decliners + ms.unchanged;
  const advanceWidth = (ms.advancers / totalBreadth) * 100;
  const unchangedWidth = (ms.unchanged / totalBreadth) * 100;
  const declineWidth = 100 - advanceWidth - unchangedWidth;
  const topMovers = [...reports].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);
  const bestIdeas = [...reports].sort((a, b) => scoreStock(b) - scoreStock(a)).slice(0, 4);

  container.innerHTML = `
    <section class="terminal-hero">
      <div class="hero-market">
        <div class="eyebrow">Live market overview</div>
        <div class="index-line">
          <span>VN-Index</span>
          <strong class="${ms.vnIndex.change >= 0 ? 'positive' : 'negative'}">${ms.vnIndex.value.toLocaleString('vi-VN')}</strong>
        </div>
        <div class="index-delta ${ms.vnIndex.change >= 0 ? 'positive' : 'negative'}">
          ${ms.vnIndex.change >= 0 ? '▲' : '▼'} ${Math.abs(ms.vnIndex.change)} điểm (${formatPercent(ms.vnIndex.changePercent)})
        </div>
      </div>
      <div class="hero-strip">
        <div><span>Giá trị GD</span><strong>${ms.totalValue}</strong></div>
        <div><span>Khối lượng</span><strong>${ms.totalVolume}</strong></div>
        <div><span>Tín hiệu AI</span><strong><em class="positive">${buyCount} mua</em> / ${holdCount} giữ / <em class="negative">${sellCount} bán</em></strong></div>
      </div>
    </section>

    <section class="market-command-grid">
      <div class="panel panel-span-2">
        <div class="panel-header">
          <div>
            <h3>Độ rộng thị trường</h3>
            <p>${ms.advancers} mã tăng, ${ms.decliners} mã giảm, ${ms.unchanged} mã đứng giá</p>
          </div>
          <span class="session-pill">Phiên sáng</span>
        </div>
        <div class="breadth-bar" aria-label="Market breadth">
          <span class="breadth-up" style="width:${advanceWidth}%"></span>
          <span class="breadth-flat" style="width:${unchangedWidth}%"></span>
          <span class="breadth-down" style="width:${declineWidth}%"></span>
        </div>
        <div class="breadth-legend">
          <span><i class="dot dot-up"></i>Tăng ${Math.round(advanceWidth)}%</span>
          <span><i class="dot dot-flat"></i>Đứng giá ${Math.round(unchangedWidth)}%</span>
          <span><i class="dot dot-down"></i>Giảm ${Math.round(declineWidth)}%</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header compact">
          <h3>Chỉ số sàn</h3>
        </div>
        ${renderIndexRow('VNINDEX', ms.vnIndex.value, ms.vnIndex.changePercent)}
        ${renderIndexRow('HNX', ms.hnxIndex.value, ms.hnxIndex.changePercent)}
        ${renderIndexRow('UPCOM', ms.upcomIndex.value, ms.upcomIndex.changePercent)}
      </div>

      <div class="panel panel-span-2">
        <div class="panel-header">
          <div>
            <h3>Heatmap ngành</h3>
            <p>Dòng tiền và sắc thái thị trường theo nhóm cổ phiếu</p>
          </div>
        </div>
        <div class="sector-heatmap">
          ${sectorPerformance.map(renderSectorTile).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header compact">
          <h3>Top biến động</h3>
        </div>
        <div class="mover-list">
          ${topMovers.map(renderMover).join('')}
        </div>
      </div>
    </section>

    <section class="workspace-grid">
      <div class="panel watchlist-panel">
        <div class="panel-header">
          <div>
            <h3>Watchlist phân tích</h3>
            <p>Tổng hợp giá, kỹ thuật, định giá và khuyến nghị AI</p>
          </div>
          <button class="ghost-button" id="sort-watchlist">Sắp xếp theo %</button>
        </div>
        <div class="table-shell">
          <table class="market-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giá</th>
                <th>%</th>
                <th>RSI</th>
                <th>MA20</th>
                <th>P/E</th>
                <th>Beta</th>
                <th>NN</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody id="watchlist-body"></tbody>
          </table>
        </div>
      </div>

      <aside class="insight-rail">
        <div class="panel">
          <div class="panel-header compact">
            <h3>Cơ hội nổi bật</h3>
          </div>
          <div class="idea-stack">
            ${bestIdeas.map(renderIdea).join('')}
          </div>
        </div>
        <div class="panel">
          <div class="panel-header compact">
            <h3>Rủi ro cần chú ý</h3>
          </div>
          <div class="risk-list">
            <div><strong>RSI cao</strong><span>MSN đang ở vùng nóng, ưu tiên quản trị vị thế.</span></div>
            <div><strong>Gãy MA20</strong><span>VIC và TCB yếu hơn mặt bằng watchlist.</span></div>
            <div><strong>Độ rộng</strong><span>Nhóm bất động sản vẫn phân hóa mạnh.</span></div>
          </div>
        </div>
      </aside>
    </section>
  `;

  renderWatchlist(reports);
  document.getElementById('sort-watchlist')?.addEventListener('click', () => {
    renderWatchlist([...reports].sort((a, b) => b.changePercent - a.changePercent));
  });
}

function renderWatchlist(reports) {
  const tbody = document.getElementById('watchlist-body');
  if (!tbody) return;
  tbody.innerHTML = reports.map((r) => {
    const meta = sectorMap[r.stockSymbol];
    const f = fundamentals[r.stockSymbol];
    const isPositive = r.change >= 0;
    const trend = r.currentPrice > r.indicators.ma20 ? 'Trên MA20' : 'Dưới MA20';
    return `
      <tr data-symbol="${r.stockSymbol}">
        <td>
          <button class="symbol-button" data-symbol="${r.stockSymbol}">
            <strong>${r.stockSymbol}</strong>
            <span>${meta?.sector || 'Khác'}</span>
          </button>
        </td>
        <td><strong>${formatVND(r.currentPrice)}</strong></td>
        <td class="${isPositive ? 'positive' : 'negative'}">${isPositive ? '▲' : '▼'} ${formatPercent(r.changePercent)}</td>
        <td>${renderMeter(r.indicators.rsi)}</td>
        <td><span class="${r.currentPrice > r.indicators.ma20 ? 'positive' : 'negative'}">${trend}</span></td>
        <td>${f.pe.toFixed(1)}</td>
        <td>${f.beta.toFixed(2)}</td>
        <td class="${f.foreign.startsWith('+') ? 'positive' : 'negative'}">${f.foreign}</td>
        <td><span class="rec-badge rec-${r.aiAnalysis.recommendation}">${r.aiAnalysis.recommendation}</span></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr, .symbol-button').forEach((el) => {
    el.addEventListener('click', (event) => {
      const symbol = event.currentTarget.dataset.symbol || event.currentTarget.closest('tr')?.dataset.symbol;
      if (symbol) window.navigateToAnalysis(symbol);
    });
  });
}

function renderIndexRow(label, value, percent) {
  const isPositive = percent >= 0;
  return `
    <div class="index-row">
      <span>${label}</span>
      <strong>${value.toLocaleString('vi-VN')}</strong>
      <em class="${isPositive ? 'positive' : 'negative'}">${formatPercent(percent)}</em>
    </div>
  `;
}

function renderSectorTile(sector) {
  const isPositive = sector.value >= 0;
  const intensity = Math.min(Math.abs(sector.value) / 2.5, 1);
  return `
    <div class="sector-tile ${isPositive ? 'sector-up' : 'sector-down'}" style="--intensity:${intensity}">
      <strong>${sector.name}</strong>
      <span class="${isPositive ? 'positive' : 'negative'}">${formatPercent(sector.value)}</span>
      <small>${sector.breadth}</small>
    </div>
  `;
}

function renderMover(report) {
  const isPositive = report.changePercent >= 0;
  return `
    <button class="mover-row" onclick="window.navigateToAnalysis('${report.stockSymbol}')">
      <span><strong>${report.stockSymbol}</strong><small>${sectorMap[report.stockSymbol]?.sector || ''}</small></span>
      <em class="${isPositive ? 'positive' : 'negative'}">${formatPercent(report.changePercent)}</em>
    </button>
  `;
}

function renderIdea(report) {
  const score = scoreStock(report);
  return `
    <button class="idea-card" onclick="window.navigateToAnalysis('${report.stockSymbol}')">
      <div>
        <strong>${report.stockSymbol}</strong>
        <span>${report.companyName}</span>
      </div>
      <div class="idea-score">
        <span>${score}/100</span>
        <small>${report.aiAnalysis.recommendation}</small>
      </div>
    </button>
  `;
}

function renderMeter(value) {
  const tone = value > 70 ? 'meter-hot' : value < 35 ? 'meter-cold' : 'meter-neutral';
  return `
    <div class="rsi-meter ${tone}">
      <span style="width:${value}%"></span>
      <strong>${value.toFixed(1)}</strong>
    </div>
  `;
}

function scoreStock(report) {
  const recommendation = report.aiAnalysis.recommendation === 'BUY' ? 25 : report.aiAnalysis.recommendation === 'HOLD' ? 10 : -10;
  const trend = report.currentPrice > report.indicators.ma20 ? 18 : -8;
  const mediumTrend = report.currentPrice > report.indicators.ma50 ? 16 : -6;
  const momentum = Math.max(-15, Math.min(20, report.changePercent * 5));
  const rsiBalance = 20 - Math.abs(report.indicators.rsi - 58) * 0.45;
  return Math.max(0, Math.min(100, Math.round(45 + recommendation + trend + mediumTrend + momentum + rsiBalance)));
}
