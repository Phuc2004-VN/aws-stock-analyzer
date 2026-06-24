/**
 * Main Entry Point - AWS Stock Analyzer Dashboard
 */
import './styles/index.css';
import { mockMarketSummary } from './data/mockData.js';
import { getCurrentUser, isAuthenticated, logout } from './services/authService.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderAnalysisPage } from './pages/AnalysisPage.js';
import { renderAlertsPage } from './pages/AlertsPage.js';

let currentPage = 'dashboard';

const pageTitles = {
  dashboard: 'Tổng quan thị trường',
  analysis: 'Phân tích kỹ thuật',
  alerts: 'Cảnh báo AI'
};

function bootstrapApp() {
  document.body.innerHTML = `
    <aside id="sidebar" class="sidebar"></aside>
    <main class="main-content">
      <header id="top-bar" class="top-bar"></header>
      <div id="page-content" class="page-content"></div>
    </main>
  `;

  renderSidebar();
  renderTopBar();
  renderPage();
}

function renderSidebar() {
  const user = getCurrentUser();
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">SA</div>
      <div>
        <h1>StockAI Pro</h1>
        <span>Vietnam equity terminal</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">Workspace</div>
      <button class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
        <span class="nav-icon">⌁</span> Tổng quan
      </button>
      <button class="nav-item ${currentPage === 'analysis' ? 'active' : ''}" data-page="analysis">
        <span class="nav-icon">⌕</span> Phân tích
      </button>
      <button class="nav-item ${currentPage === 'alerts' ? 'active' : ''}" data-page="alerts">
        <span class="nav-icon">!</span> Cảnh báo AI
      </button>
      <div class="nav-section-title">Market lists</div>
      <div class="watch-chip positive">FPT +1.93%</div>
      <div class="watch-chip positive">VCB +1.68%</div>
      <div class="watch-chip negative">VIC -2.90%</div>
    </nav>
    <div class="sidebar-footer">
      <strong>${user?.email || 'AWS Stock Analyzer'}</strong>
      <span>Fake JWT local mode</span>
      <button class="ghost-button logout-button" id="logout-button" type="button">Đăng xuất</button>
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

  document.getElementById('logout-button')?.addEventListener('click', () => {
    logout();
    currentPage = 'dashboard';
    renderLoginPage(bootstrapApp);
  });
}

function renderTopBar() {
  const topBar = document.getElementById('top-bar');
  const ms = mockMarketSummary;
  topBar.innerHTML = `
    <div class="top-bar-left">
      <button class="mobile-menu" id="mobile-menu" aria-label="Mở menu">☰</button>
      <div>
        <h2>${pageTitles[currentPage] || 'Dashboard'}</h2>
        <p>Dữ liệu giả lập cập nhật 23/06/2026 10:30</p>
      </div>
    </div>
    <div class="market-ticker">
      ${renderTicker('VN-Index', ms.vnIndex.value, ms.vnIndex.changePercent)}
      ${renderTicker('HNX', ms.hnxIndex.value, ms.hnxIndex.changePercent)}
      ${renderTicker('UPCOM', ms.upcomIndex.value, ms.upcomIndex.changePercent)}
      <div class="ticker-item">
        <span class="ticker-label">GTGD</span>
        <span class="ticker-value">${ms.totalValue}</span>
      </div>
    </div>
  `;

  document.getElementById('mobile-menu')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
}

function renderTicker(label, value, changePercent) {
  const isPositive = changePercent >= 0;
  return `
    <div class="ticker-item">
      <span class="ticker-label">${label}</span>
      <span class="ticker-value ${isPositive ? 'ticker-up' : 'ticker-down'}">
        ${value.toLocaleString('vi-VN')} ${isPositive ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
      </span>
    </div>
  `;
}

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

window.showToast = function(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};

window.navigateToAnalysis = function(symbol) {
  currentPage = 'analysis';
  renderSidebar();
  renderTopBar();
  const container = document.getElementById('page-content');
  container.innerHTML = '';
  container.className = 'page-content page-enter';
  renderAnalysisPage(container, symbol);
};

if (isAuthenticated()) {
  bootstrapApp();
} else {
  renderLoginPage(bootstrapApp);
}
