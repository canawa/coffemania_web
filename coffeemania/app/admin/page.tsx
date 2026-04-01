"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "https://api.coffeemaniavpn.ru";

type AdminUser = {
  email: string;
  balance: number;
  promo_code?: string | null;
  withdrawed?: number;
  withdraw_available?: number;
  created_at: string;
};

export default function AdminPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error("Не удалось загрузить список пользователей");
    }
    const data = (await res.json()) as AdminUser[];
    setUsers(data);
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        setIsAuthorized(false);
        return;
      }
      setIsAuthorized(true);
      await loadUsers();
    } catch {
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) return;
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ login: login.trim(), password: password.trim() }),
      });
      if (!res.ok) {
        setMessage("Неверный логин или пароль");
        return;
      }
      setIsAuthorized(true);
      setPassword("");
      await loadUsers();
    } catch {
      setMessage("Ошибка авторизации");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthorized(false);
      setUsers([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface p-6 md:p-10">
        Загрузка...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-surface text-on-surface p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-bold text-primary">Админ-панель</h1>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Логин"
            className="w-full rounded-xl px-4 py-3 bg-surface-container-high border border-outline-variant/30 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full rounded-xl px-4 py-3 bg-surface-container-high border border-outline-variant/30 outline-none"
          />
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-primary text-on-primary rounded-full py-3 font-bold"
          >
            Войти
          </button>
          {message ? (
            <div className="text-sm rounded-xl px-4 py-3 bg-secondary-fixed text-on-secondary-fixed">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Админ-панель</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadUsers}
              className="px-4 py-2 rounded-full bg-surface-container-high border border-outline-variant/30 font-semibold"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-primary text-on-primary font-semibold"
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-container-high">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Баланс</th>
                <th className="text-left p-3">Promo</th>
                <th className="text-left p-3">Выведено</th>
                <th className="text-left p-3">Доступно</th>
                <th className="text-left p-3">Создан</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-t border-outline-variant/15">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{Number(u.balance ?? 0).toFixed(2)}</td>
                  <td className="p-3">{u.promo_code || "-"}</td>
                  <td className="p-3">{Number(u.withdrawed ?? 0).toFixed(2)}</td>
                  <td className="p-3">{Number(u.withdraw_available ?? 0).toFixed(2)}</td>
                  <td className="p-3">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
