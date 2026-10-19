// Custom network helper for src/features/{feature-name}/api
// HTTP boundary is needed to support file uploads
// An HTTP boundary is a unique text string used as a delimiter to separate different blocks of data inside a form data HTTP Request
import {API_BASE_URL} from '../config';

const REQUEST_TIMEOUT_MS = 10_000; // Time out if the server hangs for over 10 seconds.

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
                ...(init.body ? {'Content-Type': 'application/fhir+json'} : {}), // Sends  a single text payload (structured JSON data).
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
        request<T>(path, {method: 'POST', body: JSON.stringify(body)}), // Turns the patient data into text
};