"use client";

/**
 * Typed API client for the NestJS backend.
 * All requests go through the sandbox gateway to the hrms-api mini-service
 * (port 3001) using relative paths + the XTransformPort query parameter.
 */

const API_PORT = 3001;

export interface ApiEnvelope<T = unknown> {
  ok: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
  meta?: Record<string, unknown>
}

export class ApiError extends Error {
  code: string
  status: number
  constructor(message: string, code = "ERROR", status = 500) {
    super(message)
    this.code = code
    this.status = status
  }
}

function withPort(path: string): string {
  if (!path.startsWith("/")) path = "/" + path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}XTransformPort=${API_PORT}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(withPort(`/api/v1${path}`), {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
  let body: ApiEnvelope<T> | null = null
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    body = null
  }
  if (!res.ok || !body?.ok) {
    throw new ApiError(
      body?.error?.message ?? `Request failed (${res.status})`,
      body?.error?.code ?? "HTTP_ERROR",
      res.status
    )
  }
  return body.data as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
  download: async (path: string, filename: string) => {
    const res = await fetch(withPort(`/api/v1${path}`), { credentials: "same-origin" })
    if (!res.ok) throw new ApiError(`Download failed (${res.status})`, "DOWNLOAD", res.status)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
