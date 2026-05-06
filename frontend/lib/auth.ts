export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified?: boolean;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kodicomply_token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('kodicomply_user');
  return u ? JSON.parse(u) : null;
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem('kodicomply_token', token);
  localStorage.setItem('kodicomply_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('kodicomply_token');
  localStorage.removeItem('kodicomply_user');
}

export function isAdmin(): boolean {
  return getUser()?.role === 'ADMIN';
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
