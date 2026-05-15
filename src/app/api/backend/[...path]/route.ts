import { apiBaseUrl, apiTimeoutMs } from "@/lib/env";

const forwardedHeaders = [
  "accept",
  "authorization",
  "content-type",
  "x-requested-with",
];

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = new URL(`${apiBaseUrl.replace(/\/$/, "")}/${path.join("/")}`);
  targetUrl.search = new URL(request.url).search;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiTimeoutMs);

  const headers = new Headers();

  for (const key of forwardedHeaders) {
    const value = request.headers.get(key);

    if (value) {
      headers.set(key, value);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      cache: "no-store",
      duplex: "half",
      signal: controller.signal,
    } as RequestInit);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Backend API timeout."
        : "Backend API tidak dapat dihubungi.";

    return Response.json(
      {
        message,
        data: {
          target: targetUrl.origin,
        },
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
