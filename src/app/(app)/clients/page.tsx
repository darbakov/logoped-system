"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn, calculateAge, CLIENT_STATUSES, CLIENT_SOURCES } from "@/lib/utils";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  diagnosis: string;
  source: string;
  status: string;
  notes: string | null;
  _count: { sessions: number; speechCards: number };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    
    const res = await fetch(`/api/clients?${params}`);
    const data = await res.json();
    setClients(data);
    setLoading(false);
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const getStatusStyle = (status: string) => {
    return CLIENT_STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-600";
  };
  const getStatusLabel = (status: string) => {
    return CLIENT_STATUSES.find((s) => s.value === status)?.label || status;
  };
  const getSourceLabel = (source: string) => {
    return CLIENT_SOURCES.find((s) => s.value === source)?.label || source;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ученики</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего: {clients.length} {clients.length === 1 ? "ученик" : "учеников"}
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Все статусы</option>
            {CLIENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Все типы</option>
            {CLIENT_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Ученики не найдены</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search || statusFilter || sourceFilter
              ? "Попробуйте изменить параметры поиска"
              : "Добавьте первого ученика"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-card-foreground truncate">
                    {client.lastName} {client.firstName} {client.patronymic}
                  </p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0", getStatusStyle(client.status))}>
                    {getStatusLabel(client.status)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{calculateAge(new Date(client.birthDate))}</span>
                  <span className="text-border">|</span>
                  <span>{client.diagnosis || "Диагноз не указан"}</span>
                  <span className="text-border">|</span>
                  <span>{getSourceLabel(client.source)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/60">
                  <span>Занятий: {client._count.sessions}</span>
                  <span>Речевых карт: {client._count.speechCards}</span>
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
