"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Check,
  CheckCircle,
  Circle,
  X,
  Search,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
}

interface ExerciseOption {
  id: number;
  title: string;
  category: { name: string };
}

interface HomeworkExercise {
  exerciseId: number;
  title: string;
}

interface HomeworkItem {
  id: number;
  clientId: number;
  sessionId: number | null;
  date: string;
  status: string;
  description: string;
  exercises: string;
  notes: string | null;
  client: { id: number; firstName: string; lastName: string };
  session: { id: number; date: string; startTime: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED: {
    label: "Назначено",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  COMPLETED: {
    label: "Выполнено",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  PARTIAL: {
    label: "Частично",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
};

export default function HomeworkPage() {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [filterClient, setFilterClient] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    description: "",
    selectedExercises: [] as HomeworkExercise[],
    notes: "",
  });

  const fetchHomework = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClient) params.set("clientId", filterClient);
    const res = await fetch(`/api/homework?${params}`);
    const data = await res.json();
    setHomework(data);
    setLoading(false);
  }, [filterClient]);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  }, []);

  const fetchExercises = useCallback(async () => {
    const res = await fetch("/api/exercises");
    const data = await res.json();
    setExercises(data);
  }, []);

  useEffect(() => {
    fetchClients();
    fetchExercises();
  }, [fetchClients, fetchExercises]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleCreate = async () => {
    if (!form.clientId || !form.description.trim()) return;

    await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        description: form.description,
        exercises: JSON.stringify(form.selectedExercises),
        notes: form.notes || null,
      }),
    });

    setShowForm(false);
    setForm({ clientId: "", description: "", selectedExercises: [], notes: "" });
    fetchHomework();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/homework/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchHomework();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить домашнее задание?")) return;
    await fetch(`/api/homework/${id}`, { method: "DELETE" });
    fetchHomework();
  };

  const toggleExercise = (ex: ExerciseOption) => {
    setForm((f) => {
      const exists = f.selectedExercises.some((e) => e.exerciseId === ex.id);
      if (exists) {
        return {
          ...f,
          selectedExercises: f.selectedExercises.filter(
            (e) => e.exerciseId !== ex.id
          ),
        };
      }
      return {
        ...f,
        selectedExercises: [
          ...f.selectedExercises,
          { exerciseId: ex.id, title: ex.title },
        ],
      };
    });
  };

  const parseExercises = (str: string): HomeworkExercise[] => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const grouped = homework.reduce(
    (acc, hw) => {
      const key = `${hw.client.lastName} ${hw.client.firstName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(hw);
      return acc;
    },
    {} as Record<string, HomeworkItem[]>
  );

  const filteredGroups = Object.entries(grouped).filter(([name]) =>
    search ? name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Домашние задания
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего: {homework.length}{" "}
            {homework.length === 1
              ? "задание"
              : homework.length < 5
                ? "задания"
                : "заданий"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить задание
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по имени ученика..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary w-full sm:w-auto sm:min-w-[200px]"
        >
          <option value="">Все ученики</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.lastName} {c.firstName}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Заданий не найдено
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Добавьте первое домашнее задание
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(([clientName, items]) => (
            <div key={clientName}>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {clientName}
                <span className="text-xs font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((hw) => {
                  const exList = parseExercises(hw.exercises);
                  const statusCfg = STATUS_CONFIG[hw.status] || STATUS_CONFIG.ASSIGNED;

                  return (
                    <div
                      key={hw.id}
                      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(hw.date)}
                          </p>
                          <span
                            className={cn(
                              "inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusCfg.bg,
                              statusCfg.color
                            )}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(hw.id)}
                          className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {hw.description && (
                        <p className="text-sm text-card-foreground mb-3 line-clamp-3">
                          {hw.description}
                        </p>
                      )}

                      {exList.length > 0 && (
                        <div className="mb-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Упражнения:
                          </p>
                          {exList.map((ex, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs text-card-foreground"
                            >
                              <Circle className="h-3 w-3 text-primary/50 flex-shrink-0" />
                              <span className="truncate">{ex.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {hw.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 mb-3">
                          {hw.notes}
                        </p>
                      )}

                      <div className="flex gap-1.5 pt-2 border-t border-border/50">
                        <button
                          onClick={() => handleStatusChange(hw.id, "COMPLETED")}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                            hw.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : "bg-muted/50 text-muted-foreground hover:bg-green-50 hover:text-green-700"
                          )}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Выполнено
                        </button>
                        <button
                          onClick={() => handleStatusChange(hw.id, "PARTIAL")}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                            hw.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-muted/50 text-muted-foreground hover:bg-yellow-50 hover:text-yellow-700"
                          )}
                        >
                          <Check className="h-3 w-3" />
                          Частично
                        </button>
                        {hw.status !== "ASSIGNED" && (
                          <button
                            onClick={() => handleStatusChange(hw.id, "ASSIGNED")}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-orange-50 hover:text-orange-700 transition-all"
                          >
                            <Circle className="h-3 w-3" />
                            Сбросить
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-card-foreground">
                Новое домашнее задание
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm({
                    clientId: "",
                    description: "",
                    selectedExercises: [],
                    notes: "",
                  });
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Ученик
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Выберите ученика</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName} {c.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Описание задания
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Опишите домашнее задание..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Упражнения
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
                  {exercises.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">
                      Нет доступных упражнений
                    </p>
                  ) : (
                    exercises.map((ex) => {
                      const selected = form.selectedExercises.some(
                        (e) => e.exerciseId === ex.id
                      );
                      return (
                        <label
                          key={ex.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                            selected
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleExercise(ex)}
                            className="h-4 w-4 rounded accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {ex.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {ex.category.name}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                {form.selectedExercises.length > 0 && (
                  <p className="text-xs text-primary mt-1">
                    Выбрано: {form.selectedExercises.length}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Заметки
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Необязательно..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm({
                    clientId: "",
                    description: "",
                    selectedExercises: [],
                    notes: "",
                  });
                }}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.clientId || !form.description.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
