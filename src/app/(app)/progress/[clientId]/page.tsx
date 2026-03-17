"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
} from "lucide-react";
import {
  cn,
  SOUND_STAGES,
  RUSSIAN_SOUNDS,
  SOUND_GROUPS,
  calculateAge,
} from "@/lib/utils";
import { downloadPdfFromHtml } from "@/lib/pdf";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  diagnosis: string;
}

interface SoundProgressEntry {
  id: number;
  clientId: number;
  sound: string;
  stage: string;
  updatedAt: string;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-500 border-gray-200",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ISOLATED: "bg-blue-50 text-blue-700 border-blue-200",
  SYLLABLES: "bg-indigo-50 text-indigo-700 border-indigo-200",
  WORDS: "bg-purple-50 text-purple-700 border-purple-200",
  PHRASES: "bg-pink-50 text-pink-700 border-pink-200",
  SPEECH: "bg-green-50 text-green-700 border-green-200",
};

const STAGE_BAR_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-300",
  IN_PROGRESS: "bg-yellow-400",
  ISOLATED: "bg-blue-400",
  SYLLABLES: "bg-indigo-400",
  WORDS: "bg-purple-400",
  PHRASES: "bg-pink-400",
  SPEECH: "bg-green-500",
};

const STAGE_CHART_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-200",
  IN_PROGRESS: "bg-yellow-300",
  ISOLATED: "bg-blue-300",
  SYLLABLES: "bg-indigo-300",
  WORDS: "bg-purple-300",
  PHRASES: "bg-pink-300",
  SPEECH: "bg-green-400",
};

function getStageIndex(stage: string): number {
  return SOUND_STAGES.findIndex((s) => s.value === stage);
}

function getStageLabel(stage: string): string {
  return SOUND_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export default function ProgressPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [progress, setProgress] = useState<SoundProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const group of Object.keys(SOUND_GROUPS)) {
        initial[group] = true;
      }
      return initial;
    }
  );
  const [initializing, setInitializing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [clientRes, progressRes] = await Promise.all([
      fetch(`/api/clients/${clientId}`),
      fetch(`/api/progress?clientId=${clientId}`),
    ]);
    const clientData = await clientRes.json();
    const progressData = await progressRes.json();
    setClient(clientData);
    setProgress(progressData);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const progressMap = new Map(progress.map((p) => [p.sound, p]));

  const updateStage = async (sound: string, stage: string) => {
    const existing = progressMap.get(sound);
    if (existing) {
      setProgress((prev) =>
        prev.map((p) => (p.sound === sound ? { ...p, stage } : p))
      );
    } else {
      setProgress((prev) => [
        ...prev,
        {
          id: Date.now(),
          clientId: parseInt(clientId),
          sound,
          stage,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, sound, stage }),
    });
  };

  const initializeSounds = async () => {
    setInitializing(true);
    const existingSounds = new Set(progress.map((p) => p.sound));
    const updates = RUSSIAN_SOUNDS.filter((s) => !existingSounds.has(s)).map(
      (sound) => ({ sound, stage: "NOT_STARTED" })
    );

    if (updates.length === 0) {
      setInitializing(false);
      return;
    }

    await fetch("/api/progress/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, updates }),
    });

    await loadData();
    setInitializing(false);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const totalTracked = progress.length;
  const completedCount = progress.filter((p) => p.stage === "SPEECH").length;
  const inProgressCount = progress.filter(
    (p) => p.stage !== "NOT_STARTED" && p.stage !== "SPEECH"
  ).length;

  const stageCounts = SOUND_STAGES.map((s) => ({
    ...s,
    count: progress.filter((p) => p.stage === s.value).length,
  }));

  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

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
        <p className="text-lg text-muted-foreground">Клиент не найден</p>
        <Link
          href="/clients"
          className="text-primary hover:underline mt-2 inline-block"
        >
          Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${clientId}`}
            className="flex items-center justify-center rounded-xl border border-border bg-card p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Прогресс звуков</h1>
            <p className="text-sm text-muted-foreground">
              {client.lastName} {client.firstName} {client.patronymic}
              {" · "}
              {calculateAge(new Date(client.birthDate))}
              {client.diagnosis && ` · ${client.diagnosis}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!client) return;
              downloadPdfFromHtml(
                `/api/progress/${clientId}/report`,
                `Отчёт_${client.lastName}_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.pdf`
              );
            }}
            className="flex items-center gap-1.5 rounded-xl bg-green-100 px-4 py-2 text-sm text-green-700 hover:bg-green-200 transition-colors"
          >
            <FileText className="h-4 w-4" /> Скачать отчёт PDF
          </button>
          <button
            onClick={initializeSounds}
            disabled={initializing}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RotateCcw className={cn("h-4 w-4", initializing && "animate-spin")} />
            {initializing ? "Инициализация..." : "Инициализировать звуки"}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Circle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Всего звуков
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalTracked}</p>
          <p className="text-sm text-muted-foreground">отслеживается</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Завершено
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-sm text-muted-foreground">этап «В речи»</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium uppercase tracking-wide">
              В работе
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          <p className="text-sm text-muted-foreground">активных звуков</p>
        </div>
      </div>

      {/* Stage Distribution Chart */}
      {totalTracked > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Распределение по этапам
          </h2>
          <div className="space-y-2.5">
            {stageCounts.map((s) => (
              <div key={s.value} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-28 text-right shrink-0">
                  {s.label}
                </span>
                <div className="flex-1 h-7 bg-muted/40 rounded-lg overflow-hidden relative">
                  <div
                    className={cn(
                      "h-full rounded-lg transition-all duration-500",
                      STAGE_CHART_COLORS[s.value]
                    )}
                    style={{
                      width: `${(s.count / maxStageCount) * 100}%`,
                      minWidth: s.count > 0 ? "24px" : "0",
                    }}
                  />
                  {s.count > 0 && (
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-foreground/70">
                      {s.count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sound Groups */}
      {totalTracked === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">
            Нет данных о прогрессе
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Нажмите «Инициализировать звуки», чтобы начать отслеживание
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(SOUND_GROUPS).map(([group, sounds]) => {
            const groupProgress = sounds
              .map((s) => progressMap.get(s))
              .filter(Boolean) as SoundProgressEntry[];
            const groupCompleted = groupProgress.filter(
              (p) => p.stage === "SPEECH"
            ).length;
            const groupTotal = groupProgress.length;

            return (
              <div
                key={group}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(group)}
                  className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{group}</span>
                    {groupTotal > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {groupCompleted}/{groupTotal} завершено
                      </span>
                    )}
                  </div>
                  {expandedGroups[group] ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedGroups[group] && (
                  <div className="border-t border-border">
                    {sounds.map((sound) => {
                      const entry = progressMap.get(sound);
                      const currentStage = entry?.stage || "NOT_STARTED";
                      const currentIndex = getStageIndex(currentStage);

                      return (
                        <div
                          key={sound}
                          className="px-5 py-3 border-b last:border-b-0 border-border/50"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-10 text-center text-sm font-bold shrink-0">
                              {sound}
                            </span>

                            {/* Stage Badge */}
                            <span
                              className={cn(
                                "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium shrink-0 min-w-[100px] justify-center",
                                STAGE_COLORS[currentStage]
                              )}
                            >
                              {getStageLabel(currentStage)}
                            </span>

                            {/* Progress Bar */}
                            <div className="flex gap-1 flex-1 max-w-[180px]">
                              {SOUND_STAGES.map((s, i) => (
                                <div
                                  key={s.value}
                                  className={cn(
                                    "h-2 flex-1 rounded-full transition-colors duration-300",
                                    i <= currentIndex
                                      ? STAGE_BAR_COLORS[s.value]
                                      : "bg-muted"
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Stage Buttons */}
                          <div className="flex flex-wrap gap-1.5 mt-2 sm:ml-14">
                            {SOUND_STAGES.map((s) => {
                              const isActive = currentStage === s.value;
                              return (
                                <button
                                  key={s.value}
                                  onClick={() => updateStage(sound, s.value)}
                                  className={cn(
                                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 border",
                                    isActive
                                      ? cn(
                                          STAGE_COLORS[s.value],
                                          "ring-2 ring-offset-1 ring-current/20 scale-105"
                                        )
                                      : "border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
