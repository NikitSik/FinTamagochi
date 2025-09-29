// src/api.ts
export type AuthResponse = { userId: string; token: string };
export type RegisterRequest = { nickname: string; password: string };
export type LoginRequest = { nickname: string; password: string };

const RAW_BASE = import.meta.env.VITE_API_URL || "https://localhost:7228";
const BASE = RAW_BASE.replace(/\/$/, ""); 

let _token: string | null = localStorage.getItem("token");

export function setAuthToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
export const getAuthToken = () => _token;
export function logout() { setAuthToken(null); localStorage.removeItem("uid"); }
export const isAuthed = () => !!getAuthToken();

export type User = {
  id: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  level?: number | null;
  finHealth?: number | null;
  avatarUrl?: string | null;
};

export type Mission = {
  id: number;
  code: string;
  title: string;
  description?: string;
  productTag?: string;
  repeatable: boolean;
  reward: { coins: number; xp: number; petId?: string | null };
  progress: {
    counter: number;
    target: number;
    status: "New" | "InProgress" | "Done";
    rewardClaimed?: boolean;
  };
};

// ---------- PET ----------
export type PetState = {
  mood: number; satiety: number; health: number;
  coins: number; background: string; items: string[];
  selectedPetId: string;           // 👈 новое
  ownedPetIds: string[];           // 👈 новое
};

export type ShopItem = {
  id: string;
  title: string;
  price: number;
  type: "food" | "bg" | "item" | "pet";
  enabled: boolean;
};

export type LatestFinance = { balance: number };

async function http<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  // Если FormData — НЕ ставим вручную Content-Type
  const headers: Record<string, string> =
    opts.body instanceof FormData
      ? { ...(opts.headers as Record<string, string> | undefined) }
      : { "Content-Type": "application/json", ...(opts.headers as Record<string, string> | undefined) };

  const token = _token ?? localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try { const text = await res.text(); if (text) message = text; } catch {}
    throw new Error(message);
  }
  return res.status === 204 ? ({} as T) : (await res.json() as T);
}

// ---------- Аватар ----------
export async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const token = _token ?? localStorage.getItem("token");
  const res = await fetch(`${BASE}/api/users/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd, // ВАЖНО: без ручного Content-Type
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try { const txt = await res.text(); if (txt) message = txt; } catch {}
    throw new Error(message);
  }

  // контроллер возвращает { url }
  const data = await res.json() as { url: string };
  return data.url;
}

// ---------- Публичное API ----------
export const api = {
  register: (data: RegisterRequest) =>
    http<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: LoginRequest) =>
    http<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => http<User>("/api/users/me"),

  uploadAvatar,

  // PET
  petState: () => http<PetState>("/api/pet/state"),
  petAction: (name: "play" | "heal" | "buy" | "set-bg", payload?: unknown) =>
    http<PetState>("/api/pet/action", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    }),

  // Missions / Finance — типы ответов точные
  missionStep: (id: number) => http<{ message: string; counter: number; target: number; status: string }>(`/api/missions/${id}/step`, { method: "POST" }),
  missionClaim: (id: number) =>
    http<{ coins: number; xp: number; petId?: string | null; repeatable: boolean; message: string }>(
      `/api/missions/${id}/claim`,
      { method: "POST" }
    ),
  createSnapshot: (payload: unknown) =>
    http<void>("/api/finance/snapshot", { method: "POST", body: JSON.stringify(payload) }),

  // ❗️главное — возвращаем Mission[]
  missions: () => http<Mission[]>("/api/missions"),

  shopItems: () => http<ShopItem[]>("/api/shop/items"),
  shopPurchase: (itemId: string) =>
    http<PetState>("/api/shop/purchase", { method: "POST", body: JSON.stringify({ itemId }) }),

  petSelect: (petId: string) =>
    http<void>("/api/pet/select", {
      method: "POST",
      body: JSON.stringify({ petId }),
    }),

  savingsGet: () => http<{ balance: number }>("/api/finance/savings"),
  savingsDeposit: (amount: number) =>
    http<{ balance: number }>("/api/finance/savings/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

      financeLatest: () => http<LatestFinance>("/api/finance/snapshot/latest"),


};
