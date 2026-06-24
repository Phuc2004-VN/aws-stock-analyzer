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

        <div class="auth-tabs" role="tablist">
          <button class="auth-tab active" data-auth-mode="login" type="button">Đăng nhập</button>
          <button class="auth-tab" data-auth-mode="register" type="button">Đăng ký</button>
        </div>

        <form class="auth-form" id="auth-form">
          <div>
            <label class="form-label" for="auth-email">Email</label>
            <input id="auth-email" type="email" placeholder="trader@example.com" autocomplete="email" />
          </div>
          <div>
            <label class="form-label" for="auth-password">Password</label>
            <input id="auth-password" type="password" placeholder="Nhập mật khẩu bất kỳ" autocomplete="current-password" />
          </div>
          <button class="btn btn-primary auth-submit" id="auth-submit" type="submit">Đăng nhập</button>
        </form>
      </section>
    </main>
  `;

  let mode = "login";
  const form = document.getElementById("auth-form");
  const submitButton = document.getElementById("auth-submit");

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      mode = tab.dataset.authMode;
      document.querySelectorAll(".auth-tab").forEach((item) => item.classList.toggle("active", item === tab));
      submitButton.textContent = mode === "register" ? "Đăng ký" : "Đăng nhập";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    completeFakeAuth({
      email: document.getElementById("auth-email").value.trim()
    });
    onAuthenticated();
  });
}
