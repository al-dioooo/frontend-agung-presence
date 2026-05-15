export const apiBaseUrl =
  process.env.AGUNG_PRESENCE_API_URL ?? "http://api-agung-presence.test/api";

export const apiTimeoutMs = Number(
  process.env.AGUNG_PRESENCE_API_TIMEOUT_MS ?? 8000,
);

export const apiProxyPath =
  process.env.NEXT_PUBLIC_API_PROXY_PATH ?? "/api/backend";
