export const TELEGRAM_CLIENT_ID = Number(
  process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID ?? "7964141443",
);

const TELEGRAM_OAUTH_ORIGIN = "https://oauth.telegram.org";
const TELEGRAM_REDIRECT_PATH = "/profile";

export type TelegramAuthResult = {
  id_token?: string;
  user?: {
    id?: number;
    name?: string;
    preferred_username?: string;
    picture?: string;
  };
  error?: string;
};

/** URL, который нужно добавить в BotFather → Web Login → Allowed URLs. */
export function getTelegramRedirectUri(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}${TELEGRAM_REDIRECT_PATH}`;
}

function decodeJwtPayload(token: string): TelegramAuthResult["user"] | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    return JSON.parse(atob(payload)) as TelegramAuthResult["user"];
  } catch {
    return null;
  }
}

function buildAuthResult(data: { error?: string; result?: string }): TelegramAuthResult {
  if (data.error) {
    return { error: data.error };
  }
  const idToken = data.result;
  if (!idToken || typeof idToken !== "string") {
    return { error: "missing id_token" };
  }
  const user = decodeJwtPayload(idToken);
  if (!user) {
    return { error: "malformed id_token" };
  }
  return { id_token: idToken, user };
}

let activeCleanup: (() => void) | null = null;

export function openTelegramLogin(callback: (data: TelegramAuthResult) => void): void {
  if (typeof window === "undefined") {
    return;
  }

  activeCleanup?.();

  const redirectUri = getTelegramRedirectUri();
  if (!redirectUri.startsWith("http")) {
    callback({ error: "Некорректный redirect_uri" });
    return;
  }

  const scope = ["openid", "profile", "telegram:bot_access"];
  const authUrl =
    `${TELEGRAM_OAUTH_ORIGIN}/auth?response_type=post_message` +
    `&client_id=${encodeURIComponent(String(TELEGRAM_CLIENT_ID))}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope.join(" "))}` +
    "&lang=ru";

  const width = 550;
  const height = 650;
  const left = Math.max(0, (screen.width - width) / 2) + (screen.availLeft | 0);
  const top = Math.max(0, (screen.height - height) / 2) + (screen.availTop | 0);
  const features =
    `width=${width},height=${height},left=${left},top=${top},status=0,location=0,menubar=0,toolbar=0`;

  let finished = false;
  const popup = window.open(authUrl, "telegram_oidc_login", features);

  const finish = (result: TelegramAuthResult) => {
    if (finished) return;
    finished = true;
    window.removeEventListener("message", onMessage);
    activeCleanup = null;
    if (popup && !popup.closed) {
      popup.close();
    }
    callback(result);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== TELEGRAM_OAUTH_ORIGIN) return;
    if (popup && event.source !== popup) return;

    let data: { event?: string; error?: string; result?: string };
    try {
      data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }

    if (data?.event === "auth_result") {
      finish(buildAuthResult(data));
    }
  };

  window.addEventListener("message", onMessage);
  activeCleanup = () => finish({ error: "popup_closed" });

  if (!popup) {
    finish({ error: "Не удалось открыть окно входа. Разрешите всплывающие окна." });
    return;
  }

  popup.focus();

  const checkClosed = () => {
    if (finished) return;
    if (!popup || popup.closed) {
      finish({ error: "popup_closed" });
      return;
    }
    window.setTimeout(checkClosed, 200);
  };
  checkClosed();
}
