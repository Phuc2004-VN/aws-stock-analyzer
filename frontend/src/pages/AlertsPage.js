/**
 * Alerts Page - Quản lý cảnh báo giá
 */
import { availableStocks, formatVND, formatDateTime } from '../data/mockData.js';
import { getAlerts, createAlert, deleteAlert } from '../services/apiService.js';

export function renderAlertsPage(container) {
  container.innerHTML = `
    <div class="alerts-layout">
      <!-- Left: Create Alert Form -->
      <div class="card alert-form-card">
        <div class="card-title" style="margin-bottom:18px">🔔 Tạo cảnh báo mới</div>
        <div class="form-group">
          <label class="form-label">Mã cổ phiếu</label>
          <select id="alert-symbol">
            ${availableStocks.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Giá mục tiêu (VND)</label>
          <input type="number" id="alert-price" placeholder="Ví dụ: 140000" min="0" step="100" />
        </div>
        <div class="form-group">
          <label class="form-label">Điều kiện</label>
          <select id="alert-condition">
            <option value="ABOVE">Vượt trên (ABOVE)</option>
            <option value="BELOW">Giảm dưới (BELOW)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Email nhận thông báo</label>
          <input type="email" id="alert-email" placeholder="email@example.com" value="phuc@example.com" />
        </div>
        <button class="btn btn-primary" id="btn-create-alert" style="width:100%;margin-top:8px;justify-content:center">
          ➕ Tạo cảnh báo
        </button>
      </div>

      <!-- Right: Alerts Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📋 Danh sách cảnh báo</div>
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

  document.getElementById('btn-create-alert').addEventListener('click', handleCreate);
  loadAlerts();
}

async function handleCreate() {
  const symbol = document.getElementById('alert-symbol').value;
  const price = parseInt(document.getElementById('alert-price').value);
  const condition = document.getElementById('alert-condition').value;
  const email = document.getElementById('alert-email').value;
  const btn = document.getElementById('btn-create-alert');

  if (!price || price <= 0) { window.showToast('Vui lòng nhập giá mục tiêu hợp lệ', 'error'); return; }
  if (!email) { window.showToast('Vui lòng nhập email', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> Đang tạo...';

  try {
    await createAlert({ stockSymbol: symbol, targetPrice: price, condition, email });
    window.showToast(`Đã tạo cảnh báo cho ${symbol} thành công!`, 'success');
    document.getElementById('alert-price').value = '';
    loadAlerts();
  } catch (err) {
    window.showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '➕ Tạo cảnh báo';
  }
}

async function loadAlerts() {
  const wrapper = document.getElementById('alerts-table-wrapper');
  const countEl = document.getElementById('alerts-count');
  
  try {
    const alerts = await getAlerts('phuc@example.com');
    const active = alerts.filter(a => a.status === 'ACTIVE').length;
    if (countEl) countEl.textContent = `${active} đang hoạt động / ${alerts.length} tổng`;

    if (alerts.length === 0) {
      wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔕</div><div class="empty-state-text">Chưa có cảnh báo nào</div></div>`;
      return;
    }

    wrapper.innerHTML = `
      <table class="alerts-table">
        <thead>
          <tr><th>Mã CP</th><th>Giá mục tiêu</th><th>Điều kiện</th><th>Trạng thái</th><th>Ngày tạo</th><th></th></tr>
        </thead>
        <tbody>
          ${alerts.map(a => `
            <tr id="alert-row-${a.alertId}">
              <td><strong>${a.stockSymbol}</strong></td>
              <td style="font-weight:600">${formatVND(a.targetPrice)} VND</td>
              <td><span class="condition-badge condition-${a.condition}">${a.condition === 'ABOVE' ? '▲ Vượt trên' : '▼ Giảm dưới'}</span></td>
              <td><span class="status-badge status-${a.status}">${a.status === 'ACTIVE' ? '● Hoạt động' : '✓ Đã kích hoạt'}</span></td>
              <td style="color:var(--text-muted);font-size:.82rem">${formatDateTime(a.createdAt)}</td>
              <td>${a.status === 'ACTIVE' ? `<button class="btn btn-danger btn-sm btn-delete-alert" data-id="${a.alertId}">Xóa</button>` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    wrapper.querySelectorAll('.btn-delete-alert').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!confirm('Bạn có chắc muốn xóa cảnh báo này?')) return;
        e.target.disabled = true;
        e.target.textContent = '...';
        try {
          await deleteAlert(id);
          window.showToast('Đã xóa cảnh báo', 'success');
          loadAlerts();
        } catch (err) {
          window.showToast(err.message, 'error');
          e.target.disabled = false;
          e.target.textContent = 'Xóa';
        }
      });
    });
  } catch (err) {
    wrapper.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">${err.message}</div></div>`;
  }
}
