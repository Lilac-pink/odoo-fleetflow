// src/lib/api.ts
// Central fetch wrapper — automatically attaches Bearer token from localStorage.

const BASE = import.meta.env.VITE_API_URL as string;

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    });

    if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
        } catch {
            // ignore parse errors
        }
        throw new ApiError(res.status, message);
    }

    // 204 No Content — return empty object
    if (res.status === 204) return {} as T;

    return res.json() as Promise<T>;
}

export const api = {
    get: <T>(path: string) =>
        request<T>(path, { method: 'GET' }),

    post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

    put: <T>(path: string, body: unknown = {}) =>
        request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

    delete: <T>(path: string) =>
        request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
