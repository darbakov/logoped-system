"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { CLIENT_SOURCES } from "@/lib/utils";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    birthDate: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    diagnosis: "",
    source: "PRIVATE",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const client = await res.json();
        router.push(`/clients/${client.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clients"
          className="flex items-center justify-center rounded-xl border border-border bg-card p-2 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Новый ученик</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Данные ребёнка</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Фамилия *</label>
              <input
                required
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Иванов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Имя *</label>
              <input
                required
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Иван"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Отчество</label>
              <input
                type="text"
                value={form.patronymic}
                onChange={(e) => updateField("patronymic", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Иванович"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Дата рождения *</label>
              <input
                required
                type="date"
                value={form.birthDate}
                onChange={(e) => updateField("birthDate", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Диагноз *</label>
            <input
              required
              type="text"
              value={form.diagnosis}
              onChange={(e) => updateField("diagnosis", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="ОНР III уровня, дизартрия"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Тип</label>
            <div className="flex gap-3">
              {CLIENT_SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateField("source", s.value)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    form.source === s.value
                      ? "bg-primary text-white"
                      : "border border-border bg-card hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Контакты родителя</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">ФИО родителя *</label>
              <input
                required
                type="text"
                value={form.parentName}
                onChange={(e) => updateField("parentName", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Иванова Мария Петровна"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Телефон *</label>
              <input
                required
                type="tel"
                value={form.parentPhone}
                onChange={(e) => updateField("parentPhone", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={form.parentEmail}
                onChange={(e) => updateField("parentEmail", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="parent@mail.ru"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Заметки</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"
            placeholder="Дополнительная информация..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Сохранение..." : "Сохранить ученика"}
        </button>
      </form>
    </div>
  );
}
