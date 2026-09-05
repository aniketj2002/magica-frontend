import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token: string | null;
  idempotencyKey?: string;
  signal?: AbortSignal;
  query?: Record<string, string | number | undefined | null>;
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]): string {
  const url = new URL(`${getBaseUrl()}/api/v1${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions): Promise<T> {
  const { method = "GET", body, token, idempotencyKey, signal, query } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = undefined;
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(response.status, "invalid_json", "Response was not valid JSON");
    }
  }

  if (!response.ok) {
    const errBody = data as ApiErrorBody | undefined;
    throw new ApiError(
      response.status,
      errBody?.error?.code ?? "unknown_error",
      errBody?.error?.message ?? `Request failed with status ${response.status}`,
      errBody?.error?.details,
    );
  }

  return data as T;
}
