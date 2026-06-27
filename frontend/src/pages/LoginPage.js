import { completeFakeAuth } from "../services/authService.js";

export function renderLoginPage(onAuthenticated) {
  document.body.innerHTML = `
    <main class="auth-shell">
      <section class="auth-panel">
        <div class="auth-brand">
          <div class="logo-mark">SA</div>
          <div>
            <h1>StockAI Pro</h1>
            <span>Vietnam equity terminal</span>
          </div>
        </div>

        <div class="auth-tabs" id="auth-tabs" role="tablist">
          <button class="auth-tab active" data-auth-mode="login" type="button">Đăng nhập</button>
          <button class="auth-tab" data-auth-mode="register" type="button">Đăng ký</button>
        </div>

        <form class="auth-form" id="auth-form">
          <div id="input-email-group">
            <label class="form-label" for="auth-email">Email</label>
            <input id="auth-email" type="email" placeholder="trader@example.com" autocomplete="email" required />
          </div>
          <div id="input-password-group">
            <label class="form-label" for="auth-password">Password</label>
            <input id="auth-password" type="password" placeholder="Nhập mật khẩu" autocomplete="current-password" required />
          </div>

          <div id="input-otp-group" style="display: none;">
            <label class="form-label" for="auth-otp">Mã xác nhận (OTP)</label>
            <p style="font-size: 13px; color: #666; margin-bottom: 8px;">Vui lòng kiểm tra email để lấy mã 6 số do AWS gửi.</p>
            <input id="auth-otp" type="text" placeholder="Nhập mã 6 số..." maxlength="6" />
          </div>

          <button class="btn btn-primary auth-submit" id="auth-submit" type="submit">Đăng nhập</button>
        </form>
      </section>
    </main>
  `;

  let mode = "login";
  const form = document.getElementById("auth-form");
  const submitButton = document.getElementById("auth-submit");
  const tabsContainer = document.getElementById("auth-tabs");

  // Lấy các khối input để ẩn/hiện
  const emailGroup = document.getElementById("input-email-group");
  const passwordGroup = document.getElementById("input-password-group");
  const otpGroup = document.getElementById("input-otp-group");
  const emailInput = document.getElementById("auth-email");

  // Xử lý chuyển tab Đăng nhập / Đăng ký
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      // Nếu đang ở bước nhập OTP thì không cho bấm tab nữa
      if (mode === "confirm") return; 

      mode = tab.dataset.authMode;
      document.querySelectorAll(".auth-tab").forEach((item) => item.classList.toggle("active", item === tab));
      submitButton.textContent = mode === "register" ? "Đăng ký" : "Đăng nhập";
    });
  });

  // Xử lý logic khi bấm nút Submit
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (mode === "login") {
      // 1. Luồng Đăng nhập: Fake Auth cho qua luôn để test local
      completeFakeAuth({ email: emailInput.value.trim() });
      onAuthenticated();
    } 
    else if (mode === "register") {
      // 2. Luồng Đăng ký: Bấm xong thì chuyển sang màn hình nhập OTP
      mode = "confirm";
      
      // Giấu form Email/Pass và dãy Tab đi
      tabsContainer.style.display = "none";
      emailGroup.style.display = "none";
      passwordGroup.style.display = "none";
      
      // Hiện form nhập OTP lên
      otpGroup.style.display = "block";
      document.getElementById("auth-otp").required = true; // Ép buộc phải nhập OTP
      submitButton.textContent = "Xác nhận mã OTP";
    } 
    else if (mode === "confirm") {
      // 3. Luồng Xác nhận OTP: Fake Auth cho qua luôn để test local
      completeFakeAuth({ email: emailInput.value.trim() });
      onAuthenticated();
    }
  });
}