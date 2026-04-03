export const API_BASE_URL = "https://api.coffeemaniavpn.ru";

export type ApiFetchInit = RequestInit & {
  /** Отключить редирект на /login при 401 (редко нужно). */
  skip401Redirect?: boolean;
};

/**
 * Обёртка над fetch: при 401 с API переносит на /login (кроме страниц входа/регистрации и /admin).
 * После редиректа возвращает тот же Response — вызывающий код должен сразу выйти, если `res.status === 401`.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: ApiFetchInit,
): Promise<Response> {
  const { skip401Redirect, ...rest } = init ?? {};
  const res = await fetch(input, rest);

  if (res.status !== 401 || skip401Redirect) {
    return res;
  }

  if (typeof window === "undefined") {
    return res;
  }

  const path = window.location.pathname;
  if (path.startsWith("/admin")) {
    return res;
  }
  if (path === "/login" || path === "/register") {
    return res;
  }

  window.location.assign("/login");
  return res;
}
