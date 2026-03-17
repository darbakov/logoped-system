"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть минимум 6 символов");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-2xl font-bold text-white shadow-lg">
          Л
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
        <p className="mt-1 text-sm text-gray-500">
          Создайте аккаунт в ЛогоПро
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/50"
      >
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Имя
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Мария Ивановна"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-11 text-sm outline-none transition-colors focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Подтверждение пароля
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Повторите пароль"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-medium text-white shadow-md transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-purple-600 hover:text-purple-700"
          >
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
