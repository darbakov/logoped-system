"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  X,
  RefreshCw,
  User,
  BookOpen,
} from "lucide-react";
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  isToday,
} from "date-fns";
import { ru } from "date-fns/locale";
import { cn, SESSION_STATUSES } from "@/lib/utils";

interface SessionClient {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
}

interface Session {
  id: number;
  clientId: number;
  date: string;
  startTime: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  isRecurring: boolean;
  recurringGroupId: string | null;
  client: SessionClient;
}

interface ClientOption {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
}

const SESSION_TYPES = [
  "Индивидуальное",
  "Групповое",
  "Диагностика",
  "Консультация",
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getStatusStyle(status: string) {
  return SESSION_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
}

function getStatusLabel(status: string) {
  return SESSION_STATUSES.find((s) => s.value === status)?.label || status;
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ScheduleContent />
    </Suspense>
  );
}

function ScheduleContent() {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("client");

  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<Session | null>(null);
  const [prefillDate, setPrefillDate] = useState("");
  const [prefillTime, setPrefillTime] = useState("");
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const [form, setForm] = useState({
    clientId: clientIdParam || "",
    date: "",
    startTime: "09:00",
    duration: "30",
    type: "Индивидуальное",
    notes: "",
    isRecurring: false,
    repeatWeeks: "4",
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const from = format(currentWeek, "yyyy-MM-dd");
    const to = format(addDays(currentWeek, 7), "yyyy-MM-dd");
    const params = new URLSearchParams({ from, to });
    if (clientIdParam) params.set("clientId", clientIdParam);

    const res = await fetch(`/api/sessions?${params}`);
    const data = await res.json();
    setSessions(data);
    setLoading(false);
  }, [currentWeek, clientIdParam]);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (showStatusModal) {
      fetch(`/api/sessions/${showStatusModal.id}/exercises`)
        .then((r) => r.json())
        .then(setSessionExercises);
      fetch("/api/exercises")
        .then((r) => r.json())
        .then(setAllExercises);
      setShowExercisePicker(false);
    }
  }, [showStatusModal]);

  function openCreateModal(date?: string, time?: string) {
    setForm({
      clientId: clientIdParam || "",
      date: date || format(new Date(), "yyyy-MM-dd"),
      startTime: time || "09:00",
      duration: "30",
      type: "Индивидуальное",
      notes: "",
      isRecurring: false,
      repeatWeeks: "4",
    });
    setPrefillDate(date || "");
    setPrefillTime(time || "");
    setShowCreateModal(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        repeatWeeks: form.isRecurring ? parseInt(form.repeatWeeks) : undefined,
      }),
    });
    setShowCreateModal(false);
    fetchSessions();
  }

  async function handleStatusChange(sessionId: number, newStatus: string) {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setShowStatusModal(null);
    fetchSessions();
  }

  async function handleDelete(sessionId: number) {
    if (!confirm("Удалить занятие?")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    setShowStatusModal(null);
    fetchSessions();
  }

  function getSessionsForDay(day: Date) {
    return sessions.filter((s) => isSameDay(new Date(s.date), day));
  }

  const weekLabel = `${format(weekDays[0], "d MMM", { locale: ru })} — ${format(weekDays[6], "d MMM yyyy", { locale: ru })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Расписание</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientIdParam ? "Занятия ученика" : "Все занятия"}
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить занятие
        </button>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-2 py-2 sm:px-3">
        <button
          onClick={() => setCurrentWeek((w) => subWeeks(w, 1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="text-sm font-semibold text-card-foreground">{weekLabel}</span>
          <button
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Сегодня
          </button>
        </div>
        <button
          onClick={() => setCurrentWeek((w) => addWeeks(w, 1))}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Week grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0 pb-2">
          <div className="flex gap-2 xl:grid xl:grid-cols-7 xl:gap-2">
            {weekDays.map((day, idx) => {
              const daySessions = getSessionsForDay(day);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-w-[130px] w-[130px] flex-shrink-0 xl:w-auto xl:min-w-0 xl:flex-shrink rounded-xl border bg-card p-2 min-h-[180px] transition-all",
                    today
                      ? "border-primary/40 bg-primary/[0.03] shadow-sm"
                      : "border-border"
                  )}
                >
                  <div className="mb-2 text-center">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase">
                      {DAY_NAMES[idx]}
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                        today
                          ? "bg-primary text-white"
                          : "text-card-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {daySessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setShowStatusModal(session)}
                        className="w-full rounded-lg border border-border/60 bg-white p-1.5 text-left transition-all hover:shadow-md hover:border-primary/30"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[11px] font-bold text-card-foreground">
                            {session.startTime}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {session.duration}м
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-card-foreground truncate">
                          {session.client.lastName} {session.client.firstName[0]}.
                        </div>
                        <span
                          className={cn(
                            "inline-block mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none",
                            getStatusStyle(session.status)
                          )}
                        >
                          {getStatusLabel(session.status)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => openCreateModal(format(day, "yyyy-MM-dd"))}
                    className="mt-1.5 flex w-full items-center justify-center rounded-lg border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create session modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-card-foreground">
                Новое занятие
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Ученик
                </label>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Выберите ученика</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName} {c.firstName} {c.patronymic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Дата
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Время
                  </label>
                  <select
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Длительность (мин)
                  </label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="20">20</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="45">45</option>
                    <option value="60">60</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    Тип
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Заметки
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Необязательно..."
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm font-medium text-card-foreground">
                    Повторять еженедельно
                  </span>
                </label>
                {form.isRecurring && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">
                      Количество недель:
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="52"
                      value={form.repeatWeeks}
                      onChange={(e) => setForm({ ...form, repeatWeeks: e.target.value })}
                      className="w-20 rounded-lg border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Создать
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session status modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-card-foreground">
                Занятие
              </h2>
              <button
                onClick={() => setShowStatusModal(null)}
                className="rounded-lg p-1 transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">
                  {showStatusModal.client.lastName}{" "}
                  {showStatusModal.client.firstName}{" "}
                  {showStatusModal.client.patronymic}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-card-foreground">
                  {format(new Date(showStatusModal.date), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-card-foreground">
                  {showStatusModal.startTime} · {showStatusModal.duration} мин ·{" "}
                  {showStatusModal.type}
                </span>
              </div>
              {showStatusModal.notes && (
                <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-2">
                  {showStatusModal.notes}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Статус
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(showStatusModal.id, s.value)}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-all",
                      showStatusModal.status === s.value
                        ? cn(s.color, "ring-2 ring-offset-1 ring-primary/30")
                        : "bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Упражнения на занятии</p>
                <button
                  onClick={() => setShowExercisePicker(!showExercisePicker)}
                  className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {showExercisePicker && (
                <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
                  {allExercises
                    .filter(
                      (e: any) =>
                        !sessionExercises.some(
                          (se: any) => se.exerciseId === e.id
                        )
                    )
                    .map((ex: any) => (
                      <button
                        key={ex.id}
                        onClick={async () => {
                          await fetch(
                            `/api/sessions/${showStatusModal.id}/exercises`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ exerciseId: ex.id }),
                            }
                          );
                          const res = await fetch(
                            `/api/sessions/${showStatusModal.id}/exercises`
                          );
                          setSessionExercises(await res.json());
                          setShowExercisePicker(false);
                        }}
                        className="flex items-center gap-2 w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{ex.title}</span>
                        {ex.category && (
                          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                            {ex.category.name}
                          </span>
                        )}
                      </button>
                    ))}
                  {allExercises.filter(
                    (e: any) =>
                      !sessionExercises.some(
                        (se: any) => se.exerciseId === e.id
                      )
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Все упражнения добавлены
                    </p>
                  )}
                </div>
              )}
              {sessionExercises.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Упражнения не привязаны
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sessionExercises.map((se: any) => (
                    <div
                      key={se.exerciseId}
                      className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{se.exercise.title}</span>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch(
                            `/api/sessions/${showStatusModal.id}/exercises`,
                            {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                exerciseId: se.exerciseId,
                              }),
                            }
                          );
                          setSessionExercises((prev: any[]) =>
                            prev.filter(
                              (x: any) => x.exerciseId !== se.exerciseId
                            )
                          );
                        }}
                        className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(showStatusModal.id)}
              className="mt-4 w-full rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Удалить занятие
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
