"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  FileText,
  TrendingUp,
  Phone,
  Mail,
  User,
  Save,
  X,
} from "lucide-react";
import { cn, calculateAge, formatDate, CLIENT_STATUSES, CLIENT_SOURCES } from "@/lib/utils";

interface ClientDetail {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  diagnosis: string;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
  sessions: Array<{ id: number; date: string; startTime: string; status: string; type: string }>;
  speechCards: Array<{ id: number; date: string; conclusion: string }>;
  soundProgress: Array<{ id: number; sound: string; stage: string }>;
  _count: { sessions: number; speechCards: number };
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClient(data);
        setLoading(false);
      });
  }, [id]);

  const startEdit = () => {
    if (!client) return;
    setEditForm({
      firstName: client.firstName,
      lastName: client.lastName,
      patronymic: client.patronymic,
      birthDate: client.birthDate.split("T")[0],
      parentName: client.parentName,
      parentPhone: client.parentPhone,
      parentEmail: client.parentEmail || "",
      diagnosis: client.diagnosis,
      source: client.source,
      status: client.status,
      notes: client.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setClient((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Вы уверены? Все данные ученика будут удалены.")) return;
    setDeleting(true);
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.push("/clients");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Ученик не найден</p>
        <Link href="/clients" className="text-primary hover:underline mt-2 inline-block">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const getStatusStyle = (s: string) => CLIENT_STATUSES.find((x) => x.value === s)?.color || "";
  const getStatusLabel = (s: string) => CLIENT_STATUSES.find((x) => x.value === s)?.label || s;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="flex items-center justify-center rounded-xl border border-border bg-card p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {client.lastName} {client.firstName} {client.patronymic}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", getStatusStyle(client.status))}>
                {getStatusLabel(client.status)}
              </span>
              <span className="text-sm text-muted-foreground">
                {calculateAge(new Date(client.birthDate))}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <>
              <button onClick={startEdit} className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors">
                <Edit className="h-4 w-4" /> Редактировать
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-card px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="h-4 w-4" /> Удалить
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Редактирование</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Фамилия</label>
              <input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Отчество</label>
              <input value={editForm.patronymic} onChange={(e) => setEditForm((p) => ({ ...p, patronymic: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дата рождения</label>
              <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm((p) => ({ ...p, birthDate: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Диагноз</label>
              <input value={editForm.diagnosis} onChange={(e) => setEditForm((p) => ({ ...p, diagnosis: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Статус</label>
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Тип</label>
              <select value={editForm.source} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                {CLIENT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Родитель</label>
              <input value={editForm.parentName} onChange={(e) => setEditForm((p) => ({ ...p, parentName: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Телефон</label>
              <input value={editForm.parentPhone} onChange={(e) => setEditForm((p) => ({ ...p, parentPhone: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Заметки</label>
              <textarea value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
              <X className="h-4 w-4" /> Отмена
            </button>
            <button onClick={saveEdit} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark transition-colors">
              <Save className="h-4 w-4" /> Сохранить
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Родитель</span>
              </div>
              <p className="font-medium">{client.parentName}</p>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{client.parentPhone}</span>
              </div>
              {client.parentEmail && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{client.parentEmail}</span>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Диагноз</span>
              </div>
              <p className="font-medium">{client.diagnosis}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Дата рождения: {formatDate(client.birthDate)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Статистика</span>
              </div>
              <p className="text-2xl font-bold text-primary">{client._count.sessions}</p>
              <p className="text-sm text-muted-foreground">занятий проведено</p>
            </div>
          </div>

          {client.notes && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Заметки</p>
              <p className="text-sm">{client.notes}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href={`/schedule?client=${client.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="rounded-xl bg-blue-100 p-2.5"><Calendar className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="font-medium">Расписание</p>
                <p className="text-xs text-muted-foreground">{client._count.sessions} занятий</p>
              </div>
            </Link>
            <Link href={`/speech-cards/${client.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="rounded-xl bg-purple-100 p-2.5"><FileText className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="font-medium">Речевые карты</p>
                <p className="text-xs text-muted-foreground">{client._count.speechCards} карт</p>
              </div>
            </Link>
            <Link href={`/progress/${client.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="rounded-xl bg-green-100 p-2.5"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="font-medium">Прогресс</p>
                <p className="text-xs text-muted-foreground">{client.soundProgress.length} звуков</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
