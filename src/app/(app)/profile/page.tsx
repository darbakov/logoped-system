"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  LogOut,
} from "lucide-react";

interface ProfileData {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  clientCount: number;
  sessionCount: number;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setProfile((p) => (p ? { ...p, name: data.name, email: data.email } : p));
      setMessage("Профиль обновлён");
      await updateSession({ name: data.name, email: data.email });
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Пароль успешно изменён");
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch {
      setPasswordError("Ошибка смены пароля");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление аккаунтом
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{profile?.clientCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">учеников</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold">{profile?.sessionCount ?? 0}</p>
          <p className="text-xs text-muted-foreground">занятий</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">С нами с</p>
          <p className="text-sm font-medium mt-1">{memberSince}</p>
        </div>
      </div>

      {/* Profile form */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Личные данные
        </h2>

        {message && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Имя</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || (name === profile?.name && email === profile?.email)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>

      {/* Password form */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          Смена пароля
        </h2>

        {passwordMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {passwordMessage}
          </div>
        )}
        {passwordError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Текущий пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background pl-10 pr-11 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Новый пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Минимум 6 символов"
              className="w-full rounded-xl border border-border bg-background pl-10 pr-11 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Подтверждение пароля
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Повторите новый пароль"
              className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {savingPassword ? "Сохранение..." : "Изменить пароль"}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-card p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Выход</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Завершить текущую сессию и выйти из аккаунта.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
