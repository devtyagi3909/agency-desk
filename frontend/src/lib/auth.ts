// JWT decode (no library needed — just base64 decode the payload)
function decodeToken(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    const decoded = typeof window !== 'undefined' ? atob(payload.replace(/-/g, "+").replace(/_/g, "/")) : Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  role: string,
  agencyId?: string
) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("role", role);
  // agency_id lives in the JWT payload
  const payload = decodeToken(accessToken);
  const aid = agencyId ?? (payload.agency_id as string) ?? "";
  localStorage.setItem("agency_id", aid);
}

export function getTokens() {
  if (typeof window === "undefined") return { accessToken: "", refreshToken: "" };
  return {
    accessToken: localStorage.getItem("access_token") ?? "",
    refreshToken: localStorage.getItem("refresh_token") ?? "",
  };
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("agency_id");
}

export function getRole(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("role") ?? "";
}

export function getAgencyId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("agency_id") ?? "";
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export function isClientUser(): boolean {
  return getRole() === "client_user";
}
