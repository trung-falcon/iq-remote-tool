// Shared-password auth (client side). The password is stored in localStorage and
// sent on every API request; the server validates it. On a 401 we clear it and
// fire `rc-unauthorized` so the login screen comes back.
const KEY = 'rc-password';
export const UNAUTHORIZED_EVENT = 'rc-unauthorized';

export function getPassword(): string | null {
  return localStorage.getItem(KEY);
}

export function setPassword(password: string): void {
  localStorage.setItem(KEY, password);
}

export function clearPassword(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
