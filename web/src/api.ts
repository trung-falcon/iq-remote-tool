// Typed fetch wrappers for the tool's API (proxied by Vite to localhost:4000).

import { clearPassword, getPassword } from "./auth";

export type ParamSummary = {
  exists: boolean;
  defaultValue: string;
  hasConditionalValues: boolean;
};

export type VersionInfo = {
  versionNumber?: string;
  updateTime?: string;
  updateUser?: string;
  description?: string;
};

export type TemplateResponse = {
  etag: string;
  version?: VersionInfo;
  params: Record<string, ParamSummary>;
  triggers: Record<string, ParamSummary>;
  adsWf: Record<string, ParamSummary>;
  inlineAds: Record<string, ParamSummary>;
  screens: Record<string, ParamSummary>;
  obsoleteNative: Record<string, ParamSummary>;
};

export type FieldError = { param: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: { error?: string; errors?: FieldError[] },
  ) {
    super(
      payload.error ??
        payload.errors?.map((e) => `${e.param}: ${e.message}`).join("; ") ??
        `HTTP ${status}`,
    );
  }
  get isEtagConflict() {
    return this.status === 409;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const password = getPassword();
  if (password) headers.Authorization = `Bearer ${password}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers as object) },
    });
  } catch {
    // fetch only rejects on network-level failures (server down, proxy reset).
    throw new ApiError(0, {
      error:
        "Không kết nối được API server (localhost:4000). Hãy chắc chắn `yarn dev` đang chạy (cả api + web).",
    });
  }
  const payload = await res
    .json()
    .catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) {
    // Stored password is missing/stale on a protected route — drop it and let the
    // login screen take over (the /login call handles its own 401 below).
    if (res.status === 401 && !url.endsWith("/login")) clearPassword();
    throw new ApiError(res.status, payload);
  }
  return payload as T;
}

export type Changes = Record<string, string>;

export const api = {
  login: (password: string) =>
    request<{ ok: true }>("/api/login", {
      method: "POST",
      headers: { Authorization: `Bearer ${password}` },
      body: JSON.stringify({ password }),
    }),

  getTemplate: () => request<TemplateResponse>("/api/template"),

  validate: (changes: Changes, deletes: string[] = []) =>
    request<{ valid: true }>("/api/validate", {
      method: "POST",
      body: JSON.stringify({ changes, deletes }),
    }),

  publish: (etag: string, changes: Changes, deletes: string[] = []) =>
    request<{ etag: string; versionNumber?: string }>("/api/publish", {
      method: "POST",
      body: JSON.stringify({ etag, changes, deletes }),
    }),

  versions: () => request<{ versions: VersionInfo[] }>("/api/versions"),

  rollback: (versionNumber: string) =>
    request<{ etag: string; versionNumber?: string }>("/api/rollback", {
      method: "POST",
      body: JSON.stringify({ versionNumber }),
    }),
};
