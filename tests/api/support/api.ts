export const API_PORT = 3999

export interface ApiResponse {
  status: number
  /** Parsed JSON, the raw text when the body is not JSON, or undefined when empty */
  body: unknown
}

/** Send a request to the API server started by `server.ts` */
export async function api(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<ApiResponse> {
  const response = await fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      accept: 'application/json',
      ...(options.body !== undefined && { 'content-type': 'application/json' }),
      ...(options.token && { authorization: `Bearer ${options.token}` }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const text = await response.text()
  let body: unknown = text || undefined
  try {
    body = JSON.parse(text)
  } catch {}
  return { status: response.status, body }
}
