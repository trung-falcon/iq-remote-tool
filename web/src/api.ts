// Typed fetch wrappers for the tool's API (proxied by Vite to localhost:4000).

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
};

export type FieldError = { param: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: { error?: string; errors?: FieldError[] },
  ) {
    super(payload.error ?? payload.errors?.map(e => `${e.param}: ${e.message}`).join('; ') ?? `HTTP ${status}`);
  }
  get isEtagConflict() {
    return this.status === 409;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  } catch {
    // fetch only rejects on network-level failures (server down, proxy reset).
    throw new ApiError(0, {
      error: 'Không kết nối được API server (localhost:4000). Hãy chắc chắn `yarn dev` đang chạy (cả api + web).',
    });
  }
  const payload = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as T;
}

export type Changes = Record<string, string>;

export const api = {
  getTemplate: () => request<TemplateResponse>('/api/template'),

  validate: (changes: Changes) =>
    request<{ valid: true }>('/api/validate', {
      method: 'POST',
      body: JSON.stringify({ changes }),
    }),

  publish: (etag: string, changes: Changes) =>
    request<{ etag: string; versionNumber?: string }>('/api/publish', {
      method: 'POST',
      body: JSON.stringify({ etag, changes }),
    }),

  versions: () => request<{ versions: VersionInfo[] }>('/api/versions'),

  rollback: (versionNumber: string) =>
    request<{ etag: string; versionNumber?: string }>('/api/rollback', {
      method: 'POST',
      body: JSON.stringify({ versionNumber }),
    }),
};
