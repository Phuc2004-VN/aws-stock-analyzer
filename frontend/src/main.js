/**
 * Main Entry Point - AWS Stock Analyzer Dashboard
 */
import './styles/index.css';
import { mockMarketSummary } from './data/mockData.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderAnalysisPage } from './pages/AnalysisPage.js';
import { renderAlertsPage } from './pages/AlertsPage.js';

let currentPage = 'dashboard';

// ============================================================
// Sidebar
// ============================================================
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">📈</div>
      <div>
        <h1>StockAI</h1>
        <span>Phân tích thông minh</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Menu chính</div>
      <div class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard" id="nav-dashboard">
        <span class="nav-icon">📊</span> Tổng quan
      </div>
      <div class="nav-item ${currentPage === 'analysis' ? 'active' : ''}" data-page="analysis" id="nav-analysis">
        <span class="nav-icon">🔍</span> Phân tích
      </div>
      <div class="nav-item ${currentPage === 'alerts' ? 'active' : ''}" data-page="alerts" id="nav-alerts">
        <span class="nav-icon">🔔</span> Cảnh báo giá
      </div>
      <div class="nav-section-title">Hệ thống</div>
      <div class="nav-item" style="opacity:0.5;cursor:default">
        <span class="nav-icon">⚙️</span> Cài đặt
      </div>
      <div class="nav-item" style="opacity:0.5;cursor:default">
        <span class="nav-icon">👤</span> Tài khoản
      </div>
    </nav>
    <div class="sidebar-footer">
      AWS Stock Analyzer v1.0<br>
      Step 1 — Mock Data
    </div>
  `;

  sidebar.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page && page !== currentPage) {
        currentPage = page;
        renderSidebar();
        renderTopBar();
        renderPage();
      }
    });
  });
}

// ============================================================
// Top Bar with Market Ticker
// ============================================================
function renderTopBar() {
  const topBar = document.getElementById('top-bar');
  const ms = mockMarketSummary;
  const pageTitles = {
    dashboard: 'Tổng Quan Thị Trường',
    analysis: 'Phân Tích Kỹ Thuật',
    alerts: 'Quản Lý Cảnh Báo Giá'
  };

  topBar.innerHTML = `
    <div class="top-bar-left">
      <h2>${pageTitles[currentPage] || 'Dashboard'}</h2>
    </div>
    <div class="market-ticker">
      <div class="ticker-item">
        <span class="ticker-label">VN-Index</span>
        <span class="ticker-value ${ms.vnIndex.change >= 0 ? 'ticker-up' : 'ticker-down'}">
          ${ms.vnIndex.value.toLocaleString('vi-VN')} 
          ${ms.vnIndex.change >= 0 ? '▲' : '▼'} ${Math.abs(ms.vnIndex.change)}
          (${ms.vnIndex.change >= 0 ? '+' : ''}${ms.vnIndex.changePercent}%)
        </span>
      </div>
      <div class="ticker-item">
        <span class="ticker-label">HNX</span>
        <span class="ticker-value ${ms.hnxIndex.change >= 0 ? 'ticker-up' : 'ticker-down'}">
          ${ms.hnxIndex.value} ${ms.hnxIndex.change >= 0 ? '▲' : '▼'} ${Math.abs(ms.hnxIndex.change)}
        </span>
      </div>
      <div class="ticker-item">
        <span class="ticker-label">KL</span>
        <span class="ticker-value" style="color:var(--accent-cyan)">${ms.totalVolume}</span>
      </div>
    </div>
  `;
}

// ============================================================
// Page Router
// ============================================================
function renderPage() {
  const container = document.getElementById('page-content');
  container.innerHTML = '';
  container.className = 'page-content page-enter';

  switch (currentPage) {
    case 'dashboard':
      renderDashboardPage(container);
      break;
    case 'analysis':
      renderAnalysisPage(container);
      break;
    case 'alerts':
      renderAlertsPage(container);
      break;
  }
}

// ============================================================
// Toast Notification
// ============================================================
window.showToast = function(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};

// Navigate to analysis page for a specific stock
window.navigateToAnalysis = function(symbol) {
  currentPage = 'analysis';
  renderSidebar();
  renderTopBar();
  renderAnalysisPage(document.getElementById('page-content'), symbol);
};

// ============================================================
// Init
// ============================================================
renderSidebar();
renderTopBar();
renderPage();
