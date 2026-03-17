"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Filter,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  _count: { exercises: number };
  children: Category[];
}

interface Exercise {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  minAge: number;
  maxAge: number;
  targetSounds: string;
  createdAt: string;
  category: { id: number; name: string };
}

interface ExerciseForm {
  title: string;
  description: string;
  categoryId: string;
  minAge: string;
  maxAge: string;
  targetSounds: string;
}

const emptyForm: ExerciseForm = {
  title: "",
  description: "",
  categoryId: "",
  minAge: "3",
  maxAge: "7",
  targetSounds: "",
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);

  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
  }, []);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set("categoryId", String(activeCategory));
    if (search) params.set("search", search);
    const res = await fetch(`/api/exercises?${params}`);
    const data = await res.json();
    setExercises(data);
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [fetchExercises]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setForm({
      title: ex.title,
      description: ex.description,
      categoryId: String(ex.categoryId),
      minAge: String(ex.minAge),
      maxAge: String(ex.maxAge),
      targetSounds: ex.targetSounds,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.categoryId) return;

    if (editingId) {
      await fetch(`/api/exercises/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    closeForm();
    fetchExercises();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить упражнение?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    fetchExercises();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    setNewCategoryName("");
    setShowCategoryInput(false);
    fetchCategories();
  };

  const totalCount = exercises.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Библиотека упражнений
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего: {totalCount}{" "}
            {totalCount === 1
              ? "упражнение"
              : totalCount < 5
                ? "упражнения"
                : "упражнений"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Добавить упражнение
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по названию, описанию или звукам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar — Categories: horizontal scroll on mobile, sidebar on desktop */}
        <aside className="lg:w-64 lg:flex-shrink-0 space-y-3 order-1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4" />
              Категории
            </h2>
            <button
              onClick={() => setShowCategoryInput((v) => !v)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Добавить категорию"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showCategoryInput && (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                placeholder="Название..."
                className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={handleCreateCategory}
                className="rounded-lg bg-primary px-2.5 py-1.5 text-white text-sm hover:bg-primary-dark transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowCategoryInput(false);
                  setNewCategoryName("");
                }}
                className="rounded-lg border border-border px-2 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 -mx-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:space-y-1 lg:gap-0 lg:pb-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all shrink-0 lg:w-full",
                activeCategory === null
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>Все упражнения</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-all shrink-0 lg:w-full",
                  activeCategory === cat.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs flex-shrink-0",
                    activeCategory === cat.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat._count.exercises}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main — Exercise Cards */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Упражнения не найдены
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search || activeCategory
                  ? "Попробуйте изменить параметры поиска"
                  : "Добавьте первое упражнение"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-card-foreground leading-snug line-clamp-2">
                      {ex.title}
                    </h3>
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(ex)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {ex.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {ex.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {ex.category.name}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-secondary/30 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
                      {ex.minAge}–{ex.maxAge} лет
                    </span>
                  </div>

                  {ex.targetSounds && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ex.targetSounds.split(",").map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-0.5 rounded-md bg-accent/20 px-1.5 py-0.5 text-xs text-accent/90"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Редактировать упражнение" : "Новое упражнение"}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Название упражнения"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Описание
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                  placeholder="Описание упражнения..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Категория
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Мин. возраст
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={18}
                    value={form.minAge}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minAge: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Макс. возраст
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={18}
                    value={form.maxAge}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxAge: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Целевые звуки
                </label>
                <input
                  type="text"
                  value={form.targetSounds}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetSounds: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Р, Рь, Л, Ль"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Через запятую
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeForm}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim() || !form.categoryId}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {editingId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
