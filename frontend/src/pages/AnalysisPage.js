/**
 * Analysis Page - Phân tích kỹ thuật chi tiết
 */
import { Chart, registerables } from 'chart.js';
import { availableStocks, formatVND, formatPercent, getRecommendationColor } from '../data/mockData.js';
import { getReport, submitAnalysis } from '../services/apiService.js';
Chart.register(...registerables);
let priceChart = null;

export function renderAnalysisPage(container, initialSymbol = null) {
  const symbol = initialSymbol || 'FPT';
  container.innerHTML = `
    <div class="analyze-form-bar">
      <div class="form-group">
        <label class="form-label">Mã cổ phiếu</label>
        <select id="analysis-symbol" style="min-width:140px">
          ${availableStocks.map(s => `<option value="${s}" ${s === symbol ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Khung thời gian</label>
        <select id="analysis-timeframe" style="min-width:120px">
          <option value="1D" selected>1 Ngày</option>
          <option value="1W">1 Tuần</option>
          <option value="1M">1 Tháng</option>
        </select>
      </div>
      <div class="form-group" style="justify-content:flex-end">
        <label class="form-label">&nbsp;</label>
        <button class="btn btn-primary" id="btn-analyze">🔍 Phân tích</button>
      </div>
      <div id="analyze-status" style="display:flex;align-items:flex-end;padding-bottom:2px"></div>
    </div>
    <div class="analysis-layout" id="analysis-content"></div>
  `;
  document.getElementById('btn-analyze').addEventListener('click', handleAnalyze);
  document.getElementById('analysis-symbol').addEventListener('change', (e) => loadAnalysis(e.target.value));
  loadAnalysis(symbol);
}

async function handleAnalyze() {
  const symbol = document.getElementById('analysis-symbol').value;
  const timeframe = document.getElementById('analysis-timeframe').value;
  const status = document.getElementById('analyze-status');
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true;
  status.innerHTML = `<span class="loading-spinner"></span><span style="color:var(--text-muted);margin-left:8px">Đang gửi...</span>`;
  try {
    const result = await submitAnalysis(symbol, timeframe);
    status.innerHTML = `<span style="color:var(--green)">✓ ${result.message}</span>`;
    window.showToast(`Đã gửi yêu cầu phân tích ${symbol}!`, 'success');
    loadAnalysis(symbol);
  } catch (err) {
    status.innerHTML = `<span style="color:var(--red)">✗ ${err.message}</span>`;
  } finally { btn.disabled = false; }
}

async function loadAnalysis(symbol) {
  const c = document.getElementById('analysis-content');
  if (!c) return;
  c.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;padding:42px"><span class="loading-spinner"></span></div>`;

  let r;
  try {
    const timeframe = document.getElementById('analysis-timeframe')?.value || '1D';
    r = await getReport(symbol, timeframe);
  } catch (error) {
    c.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">!</div><div class="empty-state-text">${error.message}</div></div>`;
    return;
  }

  const isP = r.change >= 0;
  const rc = getRecommendationColor(r.aiAnalysis.recommendation);
  c.innerHTML = `
    <div>
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:.82rem;color:var(--text-muted)">${r.companyName}</div>
            <div style="font-size:2rem;font-weight:800;margin:4px 0" class="${isP?'positive':'negative'}">${formatVND(r.currentPrice)} <span style="font-size:.85rem">VND</span></div>
            <div class="stock-change ${isP?'positive':'negative'}">${isP?'▲':'▼'} ${formatVND(Math.abs(r.change))} (${formatPercent(r.changePercent)})</div>
          </div>
          <span class="rec-badge rec-${r.aiAnalysis.recommendation}" style="font-size:1rem;padding:8px 18px">${r.aiAnalysis.recommendation}</span>
        </div>
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><div class="card-title">📈 Biểu đồ giá & MA</div></div>
        <div class="chart-container"><canvas id="price-chart"></canvas></div>
      </div>
      <div class="indicators-grid">
        <div class="indicator-card">
          <div class="indicator-label">RSI (14)</div>
          <div class="indicator-value" style="color:${r.indicators.rsi>70?'var(--red)':r.indicators.rsi<30?'var(--green)':'var(--accent-cyan)'}">${r.indicators.rsi}</div>
          <div class="rsi-gauge"><div class="rsi-needle" style="left:${r.indicators.rsi}%"></div></div>
          <div class="indicator-desc">${r.indicators.rsi>70?'Quá mua':r.indicators.rsi<30?'Quá bán':'Trung tính'}</div>
        </div>
        <div class="indicator-card">
          <div class="indicator-label">MA20</div>
          <div class="indicator-value" style="color:${r.currentPrice>r.indicators.ma20?'var(--green)':'var(--red)'}">${formatVND(r.indicators.ma20)}</div>
          <div class="indicator-desc">Giá ${r.currentPrice>r.indicators.ma20?'trên':'dưới'} MA20</div>
        </div>
        <div class="indicator-card">
          <div class="indicator-label">MA50</div>
          <div class="indicator-value" style="color:${r.currentPrice>r.indicators.ma50?'var(--green)':'var(--red)'}">${formatVND(r.indicators.ma50)}</div>
          <div class="indicator-desc">Giá ${r.currentPrice>r.indicators.ma50?'trên':'dưới'} MA50</div>
        </div>
      </div>
    </div>
    <div>
      <div class="card ai-card" style="border-color:${rc.border};margin-bottom:20px">
        <div class="ai-card-header">
          <div class="ai-icon" style="background:${rc.bg}">🤖</div>
          <div><div class="ai-rec-label">Khuyến nghị AI</div><div class="ai-rec-value" style="color:${rc.text}">${r.aiAnalysis.recommendation}</div></div>
        </div>
        <div class="ai-reasoning">${r.aiAnalysis.reasoning}</div>
        <div style="margin-top:16px;font-size:.72rem;color:var(--text-muted)">🕒 ${new Date(r.timestamp).toLocaleString('vi-VN')}</div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">📊 Tóm tắt</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:.88rem">
          ${[['Giá hiện tại',`${formatVND(r.currentPrice)} VND`],['Phiên trước',`${formatVND(r.previousClose)} VND`],['Thay đổi',formatPercent(r.changePercent)],['RSI',r.indicators.rsi],['Khung TG',r.timeFrame]].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--border-color)"><span style="color:var(--text-muted)">${l}</span><strong>${v}</strong></div>`).join('')}
        </div>
      </div>
    </div>
  `;
  requestAnimationFrame(() => drawPriceChart(r));
}

function drawPriceChart(report) {
  const canvas = document.getElementById('price-chart');
  if (!canvas) return;
  if (priceChart) { priceChart.destroy(); priceChart = null; }
  const h = report.priceHistory;
  const labels = h.map(p => { const d = new Date(p.date); return `${d.getDate()}/${d.getMonth()+1}`; });
  const prices = h.map(p => p.close);
  const ma20 = prices.map((_, i) => i < 19 ? null : Math.round(prices.slice(i-19,i+1).reduce((a,b)=>a+b)/20));

  priceChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [
      { label: `${report.stockSymbol}`, data: prices, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.3, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 },
      { label: 'MA20', data: ma20, borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false, tension: 0.3 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } },
        tooltip: { backgroundColor: '#1a2234', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: '#1e3050', borderWidth: 1, padding: 12,
          callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('vi-VN')||'N/A'} VND` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(30,48,80,0.3)' }, ticks: { color: '#64748b' } },
        y: { grid: { color: 'rgba(30,48,80,0.3)' }, ticks: { color: '#64748b', callback: v => v.toLocaleString('vi-VN') } }
      }
    }
  });
}
