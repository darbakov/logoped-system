"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Plus,
  CreditCard,
  Banknote,
  ArrowUpDown,
  X,
  Search,
  Trash2,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  sessionPrice: number | null;
}

interface FinanceSummary {
  clientId: number;
  clientName: string;
  sessionPrice: number | null;
  completedSessions: number;
  totalEarned: number;
  totalPaid: number;
  balance: number;
}

interface Payment {
  id: number;
  clientId: number;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
}

interface SessionInfo {
  id: number;
  date: string;
  startTime: string;
  duration: number;
  type: string;
  price: number | null;
  isPaid: boolean;
}

interface ClientDetail {
  clientId: number;
  clientName: string;
  sessionPrice: number | null;
  completedSessions: number;
  totalEarned: number;
  totalPaid: number;
  balance: number;
  payments: Payment[];
  sessions: SessionInfo[];
}

const METHOD_LABELS: Record<string, { label: string; icon: typeof CreditCard }> = {
  CASH: { label: "Наличные", icon: Banknote },
  CARD: { label: "Карта", icon: CreditCard },
  TRANSFER: { label: "Перевод", icon: ArrowUpDown },
};

function formatRubles(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export default function FinancePage() {
  const [summary, setSummary] = useState<FinanceSummary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    clientId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    method: "CASH",
    notes: "",
  });

  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceForm, setPriceForm] = useState({
    clientId: "",
    sessionPrice: "",
  });

  const [sortField, setSortField] = useState<"name" | "balance">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/finance");
    const data = await res.json();
    setSummary(data);
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchClients();
  }, [fetchSummary, fetchClients]);

  const fetchClientDetail = async (clientId: number) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      setClientDetail(null);
      return;
    }
    setExpandedClient(clientId);
    setDetailLoading(true);
    const res = await fetch(`/api/finance?clientId=${clientId}`);
    const data = await res.json();
    setClientDetail(data);
    setDetailLoading(false);
  };

  const handleCreatePayment = async () => {
    if (!paymentForm.clientId || !paymentForm.amount) return;

    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });

    setShowPaymentForm(false);
    setPaymentForm({
      clientId: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      method: "CASH",
      notes: "",
    });
    fetchSummary();
    if (expandedClient) fetchClientDetail(expandedClient);
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm("Удалить оплату?")) return;
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    fetchSummary();
    if (expandedClient) {
      const res = await fetch(`/api/finance?clientId=${expandedClient}`);
      const data = await res.json();
      setClientDetail(data);
    }
  };

  const handleSetPrice = async () => {
    if (!priceForm.clientId || !priceForm.sessionPrice) return;

    await fetch(`/api/clients/${priceForm.clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionPrice: parseInt(priceForm.sessionPrice) }),
    });

    setShowPriceForm(false);
    setPriceForm({ clientId: "", sessionPrice: "" });
    fetchSummary();
    fetchClients();
  };

  const toggleSort = (field: "name" | "balance") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredSummary = summary
    .filter((s) =>
      search ? s.clientName.toLowerCase().includes(search.toLowerCase()) : true
    )
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return mul * a.clientName.localeCompare(b.clientName);
      return mul * (a.balance - b.balance);
    });

  const totals = summary.reduce(
    (acc, s) => ({
      earned: acc.earned + s.totalEarned,
      paid: acc.paid + s.totalPaid,
      balance: acc.balance + s.balance,
    }),
    { earned: 0, paid: 0, balance: 0 }
  );

  const SortIcon = ({ field }: { field: "name" | "balance" }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Финансы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Учёт оплат и начислений
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPriceForm(true)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            <DollarSign className="h-4 w-4" />
            Установить цену
          </button>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Добавить оплату
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Всего начислено
            </p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">
            {formatRubles(totals.earned)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Всего оплачено
            </p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">
            {formatRubles(totals.paid)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              totals.balance >= 0 ? "bg-green-100" : "bg-red-100"
            )}>
              <Banknote className={cn(
                "h-5 w-5",
                totals.balance >= 0 ? "text-green-600" : "text-red-600"
              )} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Баланс
            </p>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            totals.balance > 0 ? "text-green-600" : totals.balance < 0 ? "text-red-600" : "text-card-foreground"
          )}>
            {totals.balance > 0 ? "+" : ""}{formatRubles(totals.balance)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по имени ученика..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Clients Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredSummary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Нет данных
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Данные появятся после добавления учеников и занятий
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_100px_100px_120px_120px_100px_40px] gap-4 px-5 py-3 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <button
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
            >
              Ученик <SortIcon field="name" />
            </button>
            <span>Цена</span>
            <span>Занятий</span>
            <span>Начислено</span>
            <span>Оплачено</span>
            <button
              onClick={() => toggleSort("balance")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Баланс <SortIcon field="balance" />
            </button>
            <span />
          </div>

          {/* Table Rows */}
          {filteredSummary.map((row) => (
            <div key={row.clientId}>
              <button
                onClick={() => fetchClientDetail(row.clientId)}
                className="w-full grid grid-cols-[1fr_100px_100px_120px_120px_100px_40px] gap-4 px-5 py-3.5 text-sm items-center transition-colors hover:bg-muted/20 text-left border-b border-border/50 last:border-0"
              >
                <span className="font-medium text-card-foreground truncate">
                  {row.clientName}
                </span>
                <span className="text-muted-foreground">
                  {row.sessionPrice ? formatRubles(row.sessionPrice) : "—"}
                </span>
                <span className="text-muted-foreground">
                  {row.completedSessions}
                </span>
                <span className="text-card-foreground font-medium">
                  {formatRubles(row.totalEarned)}
                </span>
                <span className="text-card-foreground font-medium">
                  {formatRubles(row.totalPaid)}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    row.balance > 0
                      ? "text-green-600"
                      : row.balance < 0
                        ? "text-red-600"
                        : "text-card-foreground"
                  )}
                >
                  {row.balance > 0 ? "+" : ""}
                  {formatRubles(row.balance)}
                </span>
                <span>
                  {expandedClient === row.clientId ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </button>

              {/* Expanded Detail */}
              {expandedClient === row.clientId && (
                <div className="bg-muted/10 border-b border-border px-5 py-4">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                    </div>
                  ) : clientDetail ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Payments */}
                      <div>
                        <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Оплаты
                        </h3>
                        {clientDetail.payments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Нет оплат
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {clientDetail.payments.map((p) => {
                              const methodInfo = METHOD_LABELS[p.method] || METHOD_LABELS.CASH;
                              const MethodIcon = methodInfo.icon;
                              return (
                                <div
                                  key={p.id}
                                  className="group flex items-center justify-between rounded-xl bg-card border border-border/50 px-4 py-2.5"
                                >
                                  <div className="flex items-center gap-3">
                                    <MethodIcon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium text-card-foreground">
                                        {formatRubles(p.amount)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(p.date)} · {methodInfo.label}
                                      </p>
                                      {p.notes && (
                                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                                          {p.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePayment(p.id);
                                    }}
                                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sessions */}
                      <div>
                        <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Проведённые занятия
                        </h3>
                        {clientDetail.sessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Нет завершённых занятий
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {clientDetail.sessions.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between rounded-xl bg-card border border-border/50 px-4 py-2.5"
                              >
                                <div>
                                  <p className="text-sm font-medium text-card-foreground">
                                    {formatDate(s.date)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.startTime} · {s.duration} мин · {s.type}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-card-foreground">
                                    {formatRubles(s.price || clientDetail.sessionPrice || 0)}
                                  </p>
                                  <span
                                    className={cn(
                                      "text-xs font-medium rounded-full px-2 py-0.5",
                                      s.isPaid
                                        ? "bg-green-100 text-green-700"
                                        : "bg-orange-100 text-orange-700"
                                    )}
                                  >
                                    {s.isPaid ? "Оплачено" : "Не оплачено"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-card-foreground">
                Добавить оплату
              </h2>
              <button
                onClick={() => setShowPaymentForm(false)}
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
                  value={paymentForm.clientId}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, clientId: e.target.value }))
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
                  Сумма (₽)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Дата
                </label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Способ оплаты
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CASH", "CARD", "TRANSFER"] as const).map((m) => {
                    const info = METHOD_LABELS[m];
                    const Icon = info.icon;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setPaymentForm((f) => ({ ...f, method: m }))
                        }
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          paymentForm.method === m
                            ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Заметки
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Необязательно..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePayment}
                disabled={!paymentForm.clientId || !paymentForm.amount}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Price Modal */}
      {showPriceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-card-foreground">
                Установить цену занятия
              </h2>
              <button
                onClick={() => setShowPriceForm(false)}
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
                  value={priceForm.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const client = clients.find((c) => String(c.id) === cId);
                    setPriceForm({
                      clientId: cId,
                      sessionPrice: client?.sessionPrice
                        ? String(client.sessionPrice)
                        : "",
                    });
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Выберите ученика</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName} {c.firstName}
                      {c.sessionPrice ? ` (${c.sessionPrice} ₽)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Цена за занятие (₽)
                </label>
                <input
                  type="number"
                  min="0"
                  value={priceForm.sessionPrice}
                  onChange={(e) =>
                    setPriceForm((f) => ({ ...f, sessionPrice: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPriceForm(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSetPrice}
                disabled={!priceForm.clientId || !priceForm.sessionPrice}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DollarSign className="h-4 w-4" />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
