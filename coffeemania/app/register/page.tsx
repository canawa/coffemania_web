"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ThemeToggle from "@/app/components/ThemeToggle";
import TelegramAuthButton from "@/app/components/TelegramAuthButton";
import TelegramAuthDivider from "@/app/components/TelegramAuthDivider";
import { apiFetch, API_BASE_URL } from "@/lib/apiFetch";
import { useSiteTheme } from "@/lib/useSiteTheme";

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  code: string;
};

const inputClassName =
  "w-full rounded-xl bg-surface dark:bg-[#423431] text-on-surface dark:text-[#f2e8df] px-4 py-3 border border-outline-variant/30 dark:border-[#8c7a72]/50 placeholder:text-on-surface-variant dark:placeholder:text-[#8c7a72] focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/60";

export default function RegisterPage() {
  const { isDark, setTheme } = useSiteTheme();
  const [step, setStep] = useState<"form" | "code">("form");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  const sendVerificationCode = async () => {
    const email = getValues("email").trim();
    if (!email) {
      setSubmitState({ status: "error", message: "Укажите email" });
      return false;
    }

    setIsSendingCode(true);
    setSubmitState({ status: "loading" });

    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "register" }),
      });
      const data = (await res.json()) as { status?: string; message?: string };

      if (!res.ok || data.status === "error") {
        setSubmitState({
          status: "error",
          message: data.message || `Ошибка ${res.status}`,
        });
        return false;
      }

      setSubmitState({
        status: "success",
        message: data.message || "Код отправлен на email.",
      });
      setStep("code");
      return true;
    } catch (e) {
      setSubmitState({
        status: "error",
        message: e instanceof Error ? e.message : "Не удалось отправить код.",
      });
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (step === "form") {
      await sendVerificationCode();
      return;
    }

    setSubmitState({ status: "loading" });

    try {
      const res = await apiFetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: values.email.trim(),
          password: values.password,
          code: values.code.trim(),
          created_at: new Date().toISOString(),
        }),
      });
      const data = (await res.json()) as {
        status?: "success" | "error";
        message?: string;
      };

      if (!res.ok || data?.status === "error") {
        setSubmitState({
          status: "error",
          message: data?.message || `Ошибка ${res.status}: ${res.statusText}`,
        });
        return;
      }

      setSubmitState({
        status: "success",
        message: data?.message || "Вы успешно зарегистрированы",
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

    window.location.href = "/profile";
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
              href="/login"
            >
              Войти
            </Link>
            <ThemeToggle isDark={isDark} onChange={setTheme} />
          </div>
        </div>
        <div className="bg-[#DDD0C8] dark:bg-[#423431] h-px w-full" />
      </nav>

      <main className="px-4 md:px-8 py-12 md:py-24">
        <div className="max-w-xl mx-auto">
          <section className="bg-surface-container-lowest dark:bg-[#2b1f1d] border border-outline-variant/10 dark:border-[#423431] rounded-xl p-8 md:p-10 shadow-sm">
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-primary leading-tight">
              Регистрация
            </h1>
            <p className="mt-4 text-on-surface-variant dark:text-[#c4b8b0]">
              {step === "form"
                ? "Укажите email и пароль — мы отправим код подтверждения."
                : `Введите 6-значный код из письма, отправленного на ${getValues("email")}.`}
            </p>

            <form className="mt-10 space-y-6" onSubmit={onSubmit}>
              {step === "form" ? (
                <>
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
                      autoComplete="new-password"
                      {...register("password", {
                        required: "Укажите пароль",
                        minLength: { value: 6, message: "Минимум 6 символов" },
                      })}
                    />
                    {errors.password ? (
                      <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                        {errors.password.message}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-[#c4b8b0]">
                      Подтверждение пароля
                    </label>
                    <input
                      className={inputClassName}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register("confirmPassword", {
                        required: "Подтвердите пароль",
                        validate: (value) =>
                          value === getValues("password") || "Пароли не совпадают",
                      })}
                    />
                    {errors.confirmPassword ? (
                      <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                        {errors.confirmPassword.message}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant dark:text-[#c4b8b0]">
                    Код из письма
                  </label>
                  <input
                    className={`${inputClassName} text-center text-2xl tracking-[0.4em] font-mono`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    {...register("code", {
                      required: "Введите код из письма",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Код должен состоять из 6 цифр",
                      },
                    })}
                  />
                  {errors.code ? (
                    <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                      {errors.code.message}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void sendVerificationCode()}
                    disabled={isSendingCode}
                    className="text-sm font-semibold text-primary dark:text-[#ffba38] hover:underline disabled:opacity-60"
                  >
                    {isSendingCode ? "Отправляем…" : "Отправить код повторно"}
                  </button>
                </div>
              )}

              {step === "form" ? (
                <>
                  <TelegramAuthDivider />

                  <TelegramAuthButton
                    label="Зарегистрироваться через Telegram"
                    onMessage={(message, type) =>
                      setSubmitState({
                        status: type === "error" ? "error" : "success",
                        message,
                      })
                    }
                  />
                </>
              ) : null}

              {submitState.status !== "idle" && (
                <div
                  className={
                    submitState.status === "error"
                      ? "text-sm text-on-error-container bg-error-container rounded-xl px-4 py-3"
                      : submitState.status === "success"
                        ? "text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3"
                        : "text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3"
                  }
                >
                  {submitState.status === "loading"
                    ? step === "form"
                      ? "Отправляем код…"
                      : "Регистрируем…"
                    : submitState.message}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {step === "code" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setSubmitState({ status: "idle" });
                    }}
                    className="sm:flex-1 px-6 py-4 rounded-full text-base font-bold border border-outline-variant/40 text-primary hover:bg-surface-container transition-colors"
                  >
                    Назад
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting || isSendingCode}
                  className="flex-1 bg-button text-on-button hover:bg-button-hover px-10 py-4 rounded-full text-lg font-bold shadow-xl transition-all disabled:opacity-60"
                >
                  {step === "form"
                    ? isSendingCode
                      ? "Отправляем код…"
                      : "Получить код"
                    : isSubmitting
                      ? "Регистрируем…"
                      : "Подтвердить и зарегистрироваться"}
                </button>
              </div>

              <p className="text-sm text-on-surface-variant dark:text-[#c4b8b0]">
                Уже есть аккаунт?{" "}
                <Link className="text-primary dark:text-[#ffba38] font-bold hover:underline" href="/login">
                  Войти
                </Link>
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
