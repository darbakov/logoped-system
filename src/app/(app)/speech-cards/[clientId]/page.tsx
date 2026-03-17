"use client";

import { useEffect, useState, use, useCallback, Fragment } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  FileText,
  Calendar,
  X,
} from "lucide-react";
import { cn, formatDate, SOUND_GROUPS } from "@/lib/utils";
import { downloadPdfFromHtml } from "@/lib/pdf";

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  patronymic: string;
  birthDate: string;
  diagnosis: string;
  parentName: string;
  parentPhone: string;
}

interface SoundEntry {
  status: string;
  note: string;
}

type SoundPronunciationMap = Record<string, SoundEntry>;

interface SpeechCard {
  id: number;
  clientId: number;
  date: string;
  soundPronunciation: string;
  phonematicHearing: string;
  syllableStructure: string;
  vocabulary: string;
  grammar: string;
  coherentSpeech: string;
  conclusion: string;
  createdAt: string;
}

const PRONUNCIATION_STATUSES = [
  { value: "", label: "—" },
  { value: "норма", label: "Норма" },
  { value: "замена", label: "Замена" },
  { value: "искажение", label: "Искажение" },
  { value: "отсутствие", label: "Отсутствие" },
];

function buildEmptySoundMap(): SoundPronunciationMap {
  const map: SoundPronunciationMap = {};
  for (const sounds of Object.values(SOUND_GROUPS)) {
    for (const s of sounds) {
      map[s] = { status: "", note: "" };
    }
  }
  return map;
}

function parseSoundPronunciation(raw: string): SoundPronunciationMap {
  try {
    const parsed = JSON.parse(raw);
    const base = buildEmptySoundMap();
    for (const [key, val] of Object.entries(parsed)) {
      if (typeof val === "object" && val !== null) {
        base[key] = val as SoundEntry;
      } else if (typeof val === "string") {
        base[key] = { status: val, note: "" };
      }
    }
    return base;
  } catch {
    return buildEmptySoundMap();
  }
}

interface CardFormProps {
  card?: SpeechCard;
  clientId: number;
  onSaved: () => void;
  onCancel: () => void;
}

function CardForm({ card, clientId, onSaved, onCancel }: CardFormProps) {
  const isEdit = !!card;
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(
    card ? card.date.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [soundMap, setSoundMap] = useState<SoundPronunciationMap>(
    card ? parseSoundPronunciation(card.soundPronunciation) : buildEmptySoundMap()
  );
  const [phonematicHearing, setPhonematicHearing] = useState(card?.phonematicHearing || "");
  const [syllableStructure, setSyllableStructure] = useState(card?.syllableStructure || "");
  const [vocabulary, setVocabulary] = useState(card?.vocabulary || "");
  const [grammar, setGrammar] = useState(card?.grammar || "");
  const [coherentSpeech, setCoherentSpeech] = useState(card?.coherentSpeech || "");
  const [conclusion, setConclusion] = useState(card?.conclusion || "");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of Object.keys(SOUND_GROUPS)) {
      initial[group] = true;
    }
    return initial;
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const updateSound = (sound: string, field: "status" | "note", value: string) => {
    setSoundMap((prev) => ({
      ...prev,
      [sound]: { ...prev[sound], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanedMap: SoundPronunciationMap = {};
    for (const [key, val] of Object.entries(soundMap)) {
      if (val.status) {
        cleanedMap[key] = val;
      }
    }

    const payload = {
      clientId,
      date,
      soundPronunciation: JSON.stringify(cleanedMap),
      phonematicHearing,
      syllableStructure,
      vocabulary,
      grammar,
      coherentSpeech,
      conclusion,
    };

    const url = isEdit ? `/api/speech-cards/${card.id}` : "/api/speech-cards";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onSaved();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!card) return;
    if (!confirm("Удалить эту речевую карту?")) return;
    await fetch(`/api/speech-cards/${card.id}`, { method: "DELETE" });
    onSaved();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {isEdit ? "Редактирование речевой карты" : "Новая речевая карта"}
        </h3>
        <button
          onClick={onCancel}
          className="rounded-xl p-2 hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Дата обследования</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Звукопроизношение
        </h4>
        <div className="space-y-2">
          {Object.entries(SOUND_GROUPS).map(([group, sounds]) => (
            <div key={group} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleGroup(group)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium"
              >
                <span>{group}</span>
                {expandedGroups[group] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedGroups[group] && (
                <div className="p-3 space-y-2">
                  {sounds.map((sound) => (
                    <div key={sound} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <span className="w-10 text-sm font-medium shrink-0 sm:text-center">
                        {sound}
                      </span>
                      <select
                        value={soundMap[sound]?.status || ""}
                        onChange={(e) => updateSound(sound, "status", e.target.value)}
                        className={cn(
                          "rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary w-full sm:min-w-[130px]",
                          soundMap[sound]?.status === "норма" && "text-green-600",
                          soundMap[sound]?.status === "замена" && "text-orange-600",
                          soundMap[sound]?.status === "искажение" && "text-red-600",
                          soundMap[sound]?.status === "отсутствие" && "text-red-700"
                        )}
                      >
                        {PRONUNCIATION_STATUSES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Примечание"
                        value={soundMap[sound]?.note || ""}
                        onChange={(e) => updateSound(sound, "note", e.target.value)}
                        className="w-full sm:flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Фонематический слух</label>
          <textarea
            value={phonematicHearing}
            onChange={(e) => setPhonematicHearing(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Слоговая структура</label>
          <textarea
            value={syllableStructure}
            onChange={(e) => setSyllableStructure(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Словарный запас</label>
          <textarea
            value={vocabulary}
            onChange={(e) => setVocabulary(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Грамматический строй</label>
          <textarea
            value={grammar}
            onChange={(e) => setGrammar(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Связная речь</label>
          <textarea
            value={coherentSpeech}
            onChange={(e) => setCoherentSpeech(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Заключение</label>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          {isEdit && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Удалить карту
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareCards({
  cards,
  onClose,
}: {
  cards: SpeechCard[];
  onClose: () => void;
}) {
  const [card1Id, setCard1Id] = useState(cards.length > 1 ? cards[1].id : cards[0].id);
  const [card2Id, setCard2Id] = useState(cards[0].id);

  const card1 = cards.find((c) => c.id === card1Id);
  const card2 = cards.find((c) => c.id === card2Id);

  const map1 = card1 ? parseSoundPronunciation(card1.soundPronunciation) : {};
  const map2 = card2 ? parseSoundPronunciation(card2.soundPronunciation) : {};

  const statusOrder = ["", "отсутствие", "искажение", "замена", "норма"];

  const getChange = (sound: string) => {
    const s1 = map1[sound]?.status || "";
    const s2 = map2[sound]?.status || "";
    if (s1 === s2) return "same";
    const i1 = statusOrder.indexOf(s1);
    const i2 = statusOrder.indexOf(s2);
    return i2 > i1 ? "improved" : "worsened";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Сравнение речевых карт</h3>
        <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Ранняя карта</label>
          <select
            value={card1Id}
            onChange={(e) => setCard1Id(parseInt(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {formatDate(c.date)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Поздняя карта</label>
          <select
            value={card2Id}
            onChange={(e) => setCard2Id(parseInt(e.target.value))}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {formatDate(c.date)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-medium">Звук</th>
              <th className="text-left py-2 px-2 font-medium">{card1 ? formatDate(card1.date) : ""}</th>
              <th className="text-left py-2 px-2 font-medium">{card2 ? formatDate(card2.date) : ""}</th>
              <th className="text-left py-2 px-2 font-medium">Динамика</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SOUND_GROUPS).map(([group, sounds]) => {
              const hasSounds = sounds.some(
                (s) => (map1[s]?.status || map2[s]?.status)
              );
              if (!hasSounds) return null;
              return (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={4} className="pt-3 pb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {sounds
                    .filter((s) => map1[s]?.status || map2[s]?.status)
                    .map((sound) => {
                      const change = getChange(sound);
                      return (
                        <tr key={sound} className="border-b border-border/50">
                          <td className="py-1.5 px-2 font-medium">{sound}</td>
                          <td className="py-1.5 px-2">
                            {map1[sound]?.status || "—"}
                            {map1[sound]?.note ? ` (${map1[sound].note})` : ""}
                          </td>
                          <td className="py-1.5 px-2">
                            {map2[sound]?.status || "—"}
                            {map2[sound]?.note ? ` (${map2[sound].note})` : ""}
                          </td>
                          <td className="py-1.5 px-2">
                            {change === "improved" && (
                              <span className="text-green-600 font-medium">↑ Улучшение</span>
                            )}
                            {change === "worsened" && (
                              <span className="text-red-600 font-medium">↓ Ухудшение</span>
                            )}
                            {change === "same" && (
                              <span className="text-muted-foreground">— Без изменений</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SoundSummary({ raw }: { raw: string }) {
  const map = parseSoundPronunciation(raw);
  const issues = Object.entries(map).filter(([, v]) => v.status && v.status !== "норма");
  if (issues.length === 0) return <span className="text-green-600 text-sm">Все звуки в норме</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {issues.slice(0, 6).map(([sound, entry]) => (
        <span
          key={sound}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
            entry.status === "замена" && "bg-orange-100 text-orange-700",
            entry.status === "искажение" && "bg-red-100 text-red-700",
            entry.status === "отсутствие" && "bg-red-200 text-red-800"
          )}
        >
          {sound}: {entry.status}
          {entry.note && ` (${entry.note})`}
        </span>
      ))}
      {issues.length > 6 && (
        <span className="text-xs text-muted-foreground">+{issues.length - 6}</span>
      )}
    </div>
  );
}

export default function SpeechCardsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [cards, setCards] = useState<SpeechCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<SpeechCard | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [clientRes, cardsRes] = await Promise.all([
      fetch(`/api/clients/${clientId}`),
      fetch(`/api/speech-cards?clientId=${clientId}`),
    ]);
    const clientData = await clientRes.json();
    const cardsData = await cardsRes.json();
    setClient(clientData);
    setCards(cardsData);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaved = () => {
    setShowForm(false);
    setEditingCard(null);
    setExpandedCard(null);
    loadData();
  };

  const startEdit = (card: SpeechCard) => {
    setEditingCard(card);
    setShowForm(true);
    setExpandedCard(null);
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
        <p className="text-lg text-muted-foreground">Клиент не найден</p>
        <Link href="/clients" className="text-primary hover:underline mt-2 inline-block">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/clients/${clientId}`}
            className="flex items-center justify-center rounded-xl border border-border bg-card p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Речевые карты</h1>
            <p className="text-sm text-muted-foreground">
              {client.lastName} {client.firstName} {client.patronymic}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cards.length >= 2 && !showForm && (
            <button
              onClick={() => setShowCompare(!showCompare)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Сравнить карты
            </button>
          )}
          {!showForm && (
            <button
              onClick={() => {
                setEditingCard(null);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" /> Создать новую карту
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <CardForm
          card={editingCard || undefined}
          clientId={parseInt(clientId)}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingCard(null);
          }}
        />
      )}

      {showCompare && cards.length >= 2 && (
        <CompareCards cards={cards} onClose={() => setShowCompare(false)} />
      )}

      {cards.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Нет речевых карт</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Создайте первую речевую карту для этого клиента
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                onClick={() =>
                  setExpandedCard(expandedCard === card.id ? null : card.id)
                }
                className="flex items-center justify-between w-full px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-100 p-2.5">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDate(card.date)}
                      </span>
                    </div>
                    {card.conclusion && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {card.conclusion}
                      </p>
                    )}
                  </div>
                </div>
                {expandedCard === card.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {expandedCard === card.id && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Звукопроизношение
                    </p>
                    <SoundSummary raw={card.soundPronunciation} />
                  </div>

                  {card.phonematicHearing && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Фонематический слух
                      </p>
                      <p className="text-sm">{card.phonematicHearing}</p>
                    </div>
                  )}

                  {card.syllableStructure && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Слоговая структура
                      </p>
                      <p className="text-sm">{card.syllableStructure}</p>
                    </div>
                  )}

                  {card.vocabulary && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Словарный запас
                      </p>
                      <p className="text-sm">{card.vocabulary}</p>
                    </div>
                  )}

                  {card.grammar && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Грамматический строй
                      </p>
                      <p className="text-sm">{card.grammar}</p>
                    </div>
                  )}

                  {card.coherentSpeech && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Связная речь
                      </p>
                      <p className="text-sm">{card.coherentSpeech}</p>
                    </div>
                  )}

                  {card.conclusion && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Заключение
                      </p>
                      <p className="text-sm font-medium">{card.conclusion}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (!client) return;
                        const cardDate = new Date(card.date).toLocaleDateString("ru-RU").replace(/\./g, "-");
                        downloadPdfFromHtml(
                          `/api/speech-cards/${card.id}/pdf`,
                          `Речевая_карта_${client.lastName}_${cardDate}.pdf`
                        );
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-green-100 px-4 py-2 text-sm text-green-700 hover:bg-green-200 transition-colors"
                    >
                      <FileText className="h-4 w-4" /> Скачать PDF
                    </button>
                    <button
                      onClick={() => startEdit(card)}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="h-4 w-4" /> Редактировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
