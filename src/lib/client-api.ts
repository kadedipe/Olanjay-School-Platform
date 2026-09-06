export async function requestJson<T = Record<string, unknown>>(url: string, init: RequestInit, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(body.error ?? `Request failed with status ${response.status}`);
    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("The request timed out. Check your connection and try again.");
    if (error instanceof TypeError) throw new Error("The server could not be reached. Check your internet or DNS connection and try again.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
