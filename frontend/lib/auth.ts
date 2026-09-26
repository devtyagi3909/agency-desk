export function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
}

export function setTokens(access: string, refresh: string, role: string, agencyId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('role', role);
  localStorage.setItem('agency_id', agencyId);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('role');
  localStorage.removeItem('agency_id');
}

export function getRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('role');
}

export function getAgencyId() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.agency_id || null;
  } catch (e) {
    return null;
  }
}

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export function isClientUser() {
  return getRole() === 'client_user';
}
