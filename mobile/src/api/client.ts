import {API_BASE_URL} from '../config';

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                Accept: 'application/fhir+json',
                ...(init.body ? {'Content-Type': 'application/fhir+json'} : {}),
                ...init.headers,
            },
        });
    } catch {
        throw new ApiError(0, 'Cannot reach the server');
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) throw new ApiError(res.status, `Server error (${res.status})`);
    return (await res.json()) as T;
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
        request<T>(path, {method: 'POST', body: JSON.stringify(body)}),
};