"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ThemeToggle from "@/app/components/ThemeToggle";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { useSiteTheme } from "@/lib/useSiteTheme";

type LoginFormValues = {
  email: string;
  password: string;
};

const inputClassName =
  "w-full rounded-xl bg-surface dark:bg-[#423431] text-on-surface dark:text-[#f2e8df] px-4 py-3 border border-outline-variant/30 dark:border-[#8c7a72]/50 placeholder:text-on-surface-variant dark:placeholder:text-[#8c7a72] focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/60";

export default function LoginPage() {
  const { isDark, setTheme } = useSiteTheme();
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const statusStyles = {
    loading: "text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3",
    success:
      "text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3",
    error: "text-sm text-on-error-container bg-error-container rounded-xl px-4 py-3",
  } as const;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitState({ status: "loading" });

    try {
      const res = await apiFetch(`${API_BASE_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      let message = "";

      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { message?: string; status?: string };
        message = data.message ?? data.status ?? "";
      } else {
        message = (await res.text()).trim();
      }

      if (!res.ok) {
        setSubmitState({
          status: "error",
          message: `Ошибка ${res.status}: ${message || res.statusText}`,
        });
        return;
      }

      setSubmitState({
        status: "success",
        message: message || "Вход выполнен успешно.",
      });
    } catch (e) {
      setSubmitState({
        status: "error",
        message:
          e instanceof Error
            ? e.message
            : "Не удалось выполнить запрос на сервер.",
      });
    return;
    }

    window.location.href='/profile';
  });

  return (
    <div className="flex-1 bg-surface text-on-surface selection:bg-tertiary-fixed">
      <nav className="sticky top-0 z-50 bg-[#EDE0D8] dark:bg-[#1a1110] border-none shadow-none">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full gap-2 sm:gap-3 px-3 md:px-8 py-2.5 md:py-4 max-w-7xl mx-auto">
          <Link
            className="flex items-center gap-2 text-xs sm:text-xl md:text-2xl font-serif font-bold text-[#3D1C1C] dark:text-[#f2e8df] min-w-0"
            href="/"
          >
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain dark:brightness-0 dark:invert" />
            <div>
              <span className="bg-[#C8B8A8] dark:bg-orange-300 px-1 text-[#3D1C1C]">КОФЕМАНИЯ</span>
              <span className="hidden sm:inline"> ВПН</span>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              className="hidden sm:inline text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors duration-300"
              href="/#prices"
            >
              Цены
            </Link>
            <Link
              className="hidden sm:inline text-[#B09080] dark:text-[#8c7a72] hover:text-[#3D1C1C] dark:hover:text-[#f2e8df] transition-colors duration-300"
              href="/register"
            >
              Регистрация
            </Link>
            <ThemeToggle isDark={isDark} onChange={setTheme} />
            <Link
              className="shrink-0 bg-button text-on-button px-2.5 sm:px-6 py-2 rounded-full text-[11px] sm:text-base font-bold hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              href="/login"
            >
              Войти
            </Link>
          </div>
        </div>
        <div className="bg-[#DDD0C8] dark:bg-[#423431] h-px w-full" />
      </nav>

      <main className="px-4 md:px-8 py-12 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <section className="bg-surface-container-lowest dark:bg-[#2b1f1d] border border-outline-variant/10 dark:border-[#423431] rounded-xl p-8 md:p-10 shadow-sm">
            <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-primary leading-tight">
              Вход в личный кабинет
            </h1>
            <p className="mt-4 text-on-surface-variant dark:text-[#c4b8b0]">
              Введите данные доступа. Если у вас ещё нет подписки — выберите тариф и
              получите доступ за минуту.
            </p>


            <form className="mt-10 space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-[#c4b8b0]">
                  Email
                </label>
                <input
                  className={inputClassName}
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  {...register("email", {
                    required: "Укажите email",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                      message: "Некорректный email",
                    },
                  })}
                />
                {errors.email ? (
                  <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                    {errors.email.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-[#c4b8b0]">
                  Пароль
                </label>
                <input
                  className={inputClassName}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Укажите пароль",
                    minLength: {
                      value: 4,
                      message: "Слишком короткий пароль",
                    },
                  })}
                />
                {errors.password ? (
                  <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                    {errors.password.message}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <a
                  className="text-sm font-semibold text-primary hover:underline"
                  href="#"
                >
                  Забыли пароль?
                </a>
              </div>

              {submitState.status !== "idle" ? (
                <div
                  className={
                    submitState.status === "loading"
                      ? statusStyles.loading
                      : submitState.status === "success"
                        ? statusStyles.success
                        : statusStyles.error
                  }
                >
                  {submitState.status === "loading"
                    ? "Отправляем запрос…"
                    : submitState.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-button text-on-button hover:bg-button-hover px-10 py-4 rounded-full text-lg font-bold shadow-xl transition-all disabled:opacity-60"
              >
                {isSubmitting ? "Входим…" : "Войти"}
              </button>

              <p className="text-sm text-on-surface-variant dark:text-[#c4b8b0]">
                Нет аккаунта?{" "}
                <Link className="text-primary dark:text-[#ffba38] font-bold hover:underline" href="/register">
                  Зарегистрироваться
                </Link>
              </p>
            </form>
          </section>

          <aside className="relative overflow-hidden rounded-xl bg-primary dark:bg-[#423431] text-on-primary dark:text-[#f2e8df] p-10 md:p-12 shadow-2xl border border-transparent dark:border-[#8c7a72]/30">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-tertiary-fixed opacity-20 blur-3xl rounded-full" />
            <div className="relative">
              <h2 className="font-headline text-3xl font-bold">
                Доступ к подписке и инструкциям
              </h2>
              <p className="mt-4 text-on-primary-container dark:text-[#c4b8b0]">
                После входа вы сможете управлять подпиской, проверять её статус и
                открывать быстрые инструкции по подключению.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/10 dark:bg-black/25 rounded-xl p-5">
                  <div className="font-bold">Быстрый старт</div>
                  <div className="mt-2 text-sm text-on-primary-container dark:text-[#c4b8b0]">
                    Подключение за 2 минуты.
                  </div>
                </div>
                <div className="bg-black/10 dark:bg-black/25 rounded-xl p-5">
                  <div className="font-bold">Безопасно</div>
                  <div className="mt-2 text-sm text-on-primary-container dark:text-[#c4b8b0]">
                    Защищённое шифрованное соединение.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

