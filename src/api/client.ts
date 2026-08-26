import { API_BASE_URL, USE_MOCK_API } from './config';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

// Authenticated fetch wrapper for main-frame's API. Once EXPO_PUBLIC_API_BASE_URL
// is set (USE_MOCK_API becomes false), every call here goes to the real
// backend with the session token attached as a bearer header.
export async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestOptions = {}
): Promise<T> {
  if (USE_MOCK_API) {
    throw new Error(
      `apiFetch('${path}') called with no EXPO_PUBLIC_API_BASE_URL configured. ` +
        'Use the mock functions in src/api/mock.ts until main-frame is deployed.'
    );
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
