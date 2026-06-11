import { NextRequest, NextResponse } from "next/server";

const SERVER_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const path = pathSegments.join("/");
  const target = new URL(`${SERVER_API_URL.replace(/\/$/, "")}/${path}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { status: "error", message: "Сервер API недоступен. Запустите бэкенд." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const backendContentType = backendRes.headers.get("content-type");
  if (backendContentType) {
    responseHeaders.set("content-type", backendContentType);
  }

  const setCookies =
    typeof backendRes.headers.getSetCookie === "function"
      ? backendRes.headers.getSetCookie()
      : [];

  const body = await backendRes.text();
  const response = new NextResponse(body, {
    status: backendRes.status,
    headers: responseHeaders,
  });

  for (const setCookie of setCookies) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
