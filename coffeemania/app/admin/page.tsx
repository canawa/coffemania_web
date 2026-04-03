"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "https://api.coffeemaniavpn.ru";

type AdminUser = {
  id: number;
  email: string;
  balance: number;
  created_at: string;
  promo_code: string | null;
  withdrawed: number;
  withdraw_available: number;
};

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      credentials: "include",
    });
    if (!res.ok) {
      setIsAuthed(false);
      setUsers([]);
      return;
    }
    const data = (await res.json()) as { users?: AdminUser[] };
    setUsers(data.users ?? []);
  }, []);

  useEffect(() => {
    const check = async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/me`, {
          credentials: "include",
        });
        if (res.ok) {
          setIsAuthed(true);
          await loadUsers();
        } else {
          setIsAuthed(false);
        }
      } catch {
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [loadUsers]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        let msg = "Ошибка входа";
        try {
          const j = (await res.json()) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          if (res.status === 503) msg = "Админка не настроена на сервере";
        }
        setError(msg);
        return;
      }
      setIsAuthed(true);
      setPassword("");
      await loadUsers();
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsAuthed(false);
    setUsers([]);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-4">
        <p className="text-on-surface-variant">Загрузка...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
          <h1 className="font-headline text-2xl font-bold text-primary mb-2">
            Админ-панель
          </h1>
          <p className="text-on-surface-variant text-sm mb-6">
            Вход только для администратора.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Логин
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-surface-container-high px-4 py-3 text-primary outline-none border-2 border-transparent focus:border-tertiary-fixed"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Пароль
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-surface-container-high px-4 py-3 text-primary outline-none border-2 border-transparent focus:border-tertiary-fixed"
                required
              />
            </div>
            {error ? (
              <div className="text-sm text-[var(--error)] bg-[var(--error-container)]/40 rounded-xl px-3 py-2">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary py-3 rounded-full font-bold hover:brightness-95 transition-all disabled:opacity-60"
            >
              {isSubmitting ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="font-headline text-3xl font-bold text-primary">
            Админ-панель
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 px-6 py-2 rounded-full border border-outline-variant/30 text-primary font-bold hover:bg-surface-container transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                <th className="px-4 py-3 font-bold text-on-surface-variant">ID</th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">Email</th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">Баланс</th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">
                  Промокод
                </th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">
                  Выведено
                </th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">
                  К выводу
                </th>
                <th className="px-4 py-3 font-bold text-on-surface-variant">
                  Регистрация
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low/50"
                >
                  <td className="px-4 py-3 text-on-surface-variant">{u.id}</td>
                  <td className="px-4 py-3 font-medium break-all">{u.email}</td>
                  <td className="px-4 py-3">{Number(u.balance).toFixed(2)} ₽</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {u.promo_code ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {Number(u.withdrawed).toFixed(2)} ₽
                  </td>
                  <td className="px-4 py-3">
                    {Number(u.withdraw_available).toFixed(2)} ₽
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                    {u.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p className="px-4 py-8 text-center text-on-surface-variant">
              Пользователей пока нет.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
