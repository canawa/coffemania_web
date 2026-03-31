"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
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
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitState({ status: "loading" });

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          created_at: new Date().toISOString(),
        }),
      });
      const data = (await res.json()) as {
        status?: "success" | "error";
        message?: string;
      };

      if (!res.ok) {
        setSubmitState({
          status: "error",
          message: data?.message || `Ошибка ${res.status}: ${res.statusText}`,
        });
        return;
      }

      if (data?.status === "error") {
        setSubmitState({
          status: "error",
          message: data.message || "Ошибка регистрации.",
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
      <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a] border-none shadow-none">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link
            className="flex items-center gap-2 text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff]"
            href="/"
          >
            <img src="/logo.svg" alt="Логитип" className="w-8 h-8 object-contain" />
            <div>
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span> ВПН
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="text-[#504442] dark:text-[#efeeea] hover:text-[#271310] dark:hover:text-[#ffba38] transition-colors duration-300"
              href="/#prices"
            >
              Цены
            </Link>
            <Link
              className="text-[#504442] dark:text-[#efeeea] hover:text-[#271310] dark:hover:text-[#ffba38] transition-colors duration-300"
              href="/login"
            >
              Войти
            </Link>
            <Link
              className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
              href="/register"
            >
              Регистрация
            </Link>
          </div>
        </div>
        <div className="bg-surface-container dark:bg-[#2a2a28] h-px w-full" />
      </nav>

      <main className="px-8 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
          <section className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 md:p-10 shadow-sm">
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight">
              Регистрация
            </h1>
            <p className="mt-4 text-on-surface-variant">
              Создайте аккаунт для доступа к личному кабинету и ключам.
            </p>

            <form className="mt-10 space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Email
                </label>
                <input
                  className="w-full rounded-xl bg-surface px-4 py-3 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/60"
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
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Пароль
                </label>
                <input
                  className="w-full rounded-xl bg-surface px-4 py-3 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/60"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password", {
                    required: "Укажите пароль",
                    minLength: {
                      value: 6,
                      message: "Минимум 6 символов",
                    },
                  })}
                />
                {errors.password ? (
                  <div className="text-sm text-on-error-container bg-error-container rounded-lg px-3 py-2">
                    {errors.password.message}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  Подтверждение пароля
                </label>
                <input
                  className="w-full rounded-xl bg-surface px-4 py-3 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-tertiary-fixed/60"
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

              {submitState.status !== "idle" && (
                <div
                  className={
                    submitState.status === "error"
                      ? "text-sm text-on-error-container bg-error-container rounded-xl px-4 py-3"
                      : submitState.status === "success"
                        ? "text-sm text-on-secondary-fixed bg-secondary-fixed rounded-xl px-4 py-3"
                        : submitState.status === "loading"
                          ? "text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3"
                          : "text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3"
                  }
                >
                  {submitState.status === "loading"
                    ? "Отправляем запрос…"
                    : submitState.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-primary/20 transition-all"
              >
                {isSubmitting ? "Регистрируем…" : "Зарегистрироваться"}
              </button>

              <p className="text-sm text-on-surface-variant">
                Уже есть аккаунт?{" "}
                <Link className="text-primary font-bold hover:underline" href="/login">
                  Войти
                </Link>
              </p>
            </form>
          </section>

          <aside className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-10 md:p-12 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-tertiary-fixed opacity-20 blur-3xl rounded-full" />
            <div className="relative">
              <span className="material-symbols-outlined text-tertiary-fixed text-5xl">
                person_add
              </span>
              <h2 className="font-headline text-3xl font-bold mt-6">
                Создайте аккаунт за минуту
              </h2>
              <p className="mt-4 text-on-primary-container">
                После регистрации сможете войти в кабинет и управлять подпиской.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

