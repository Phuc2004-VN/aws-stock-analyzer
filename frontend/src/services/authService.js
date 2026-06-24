const TOKEN_KEY = "stockai.fakeToken";
const USER_KEY = "stockai.user";

export const FAKE_JWT = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJzdWIiOiJsb2NhbC10cmFkZXIiLCJlbWFpbCI6InRyYWRlckBleGFtcGxlLmNvbSIsInJvbGUiOiJUUkFERVIiLCJpYXQiOjE3ODIyOTg2NjF9",
  "fake-signature-for-local-test"
].join(".");

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function completeFakeAuth({ email }) {
  const user = {
    email: email || "trader@example.com",
    signedInAt: new Date().toISOString()
  };

  localStorage.setItem(TOKEN_KEY, FAKE_JWT);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
