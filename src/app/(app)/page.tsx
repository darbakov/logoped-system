"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Users,
  CalendarDays,
  TrendingUp,
  Plus,
  BookOpen,
  UserPlus,
  Cake,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DashboardData {
  totalClients: number;
  activeClients: number;
  todaySessions: number;
  weekSessions: number;
  completedThisMonth: number;
  recentClients: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    diagnosis: string | null;
    createdAt: string;
  }[];
  upcomingSessions: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    client: { id: string; firstName: string; lastName: string };
  }[];
  birthdays: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    nextBirthday: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const today = new Date();
  const formattedDate = format(today, "EEEE, d MMMM yyyy", { locale: ru });

  const stats = [
    {
      label: "Всего учеников",
      value: data.totalClients,
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Активные ученики",
      value: data.activeClients,
      icon: UserPlus,
      bg: "bg-green-50",
      iconColor: "text-green-600",
      border: "border-green-100",
    },
    {
      label: "Занятий сегодня",
      value: data.todaySessions,
      icon: CalendarDays,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
      border: "border-purple-100",
    },
    {
      label: "Занятий на неделе",
      value: data.weekSessions,
      icon: Clock,
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
      border: "border-orange-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
          Добро пожаловать в ЛогоПро
        </h1>
        <p className="mt-1 text-sm capitalize text-gray-500">
          {formattedDate}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} ${stat.border} rounded-2xl border p-5 transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.iconColor} flex h-12 w-12 items-center justify-center rounded-xl bg-white/80`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Upcoming sessions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Ближайшие занятия
            </h2>
            <Link
              href="/schedule"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Расписание
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.upcomingSessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Нет запланированных занятий
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3 sm:max-h-none">
              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.client.lastName} {session.client.firstName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(session.date), "d MMM", {
                          locale: ru,
                        })}
                        {" · "}
                        {session.startTime}–{session.endTime}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Запланировано
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Birthdays */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Cake className="h-5 w-5 text-pink-500" />
              Дни рождения
            </h2>
            {data.birthdays.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                Нет ближайших дней рождения
              </p>
            ) : (
              <div className="space-y-3">
                {data.birthdays.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-3 rounded-xl bg-pink-50 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 text-pink-500">
                      <Cake className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {child.lastName} {child.firstName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(child.nextBirthday), "d MMMM", {
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly stat */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Проведено занятий в этом месяце
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.completedThisMonth}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent clients */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Новые ученики
            </h2>
            <Link
              href="/clients"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Все ученики
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {data.recentClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Ученики не добавлены
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {client.lastName[0]}
                      {client.firstName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {client.lastName} {client.firstName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.diagnosis || "Диагноз не указан"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(client.createdAt), "d MMM yyyy", {
                      locale: ru,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/clients/new"
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 transition-colors hover:bg-blue-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-200 text-blue-700">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Добавить ученика
              </span>
            </Link>

            <Link
              href="/schedule"
              className="flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-4 transition-colors hover:bg-purple-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-200 text-purple-700">
                <CalendarDays className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Открыть расписание
              </span>
            </Link>

            <Link
              href="/exercises"
              className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-4 transition-colors hover:bg-green-100 sm:col-span-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-200 text-green-700">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                Упражнения
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
