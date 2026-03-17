"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Search, ChevronRight, Users } from "lucide-react";
import { calculateAge } from "@/lib/utils";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  diagnosis: string;
  status: string;
  _count: { sessions: number; speechCards: number };
}

export default function ProgressIndexPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("status", "ACTIVE");
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Прогресс</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите ученика для отслеживания прогресса по звукам
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск ученика по имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {search ? "Ученики не найдены" : "Нет активных учеников"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search ? "Попробуйте изменить запрос" : "Добавьте ученика, чтобы начать"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/progress/${client.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-card-foreground truncate">
                  {client.lastName} {client.firstName} {client.patronymic}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{calculateAge(new Date(client.birthDate))}</span>
                  <span className="text-border">|</span>
                  <span>{client.diagnosis}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
