import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { clientId } = await params;
  const id = parseInt(clientId);

  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
    include: {
      soundProgress: true,
      sessions: { where: { status: "COMPLETED" }, orderBy: { date: "desc" }, take: 20 },
      speechCards: { orderBy: { date: "desc" }, take: 2 },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const birthDate = new Date(client.birthDate);
  const now = new Date();
  const ageYears = now.getFullYear() - birthDate.getFullYear();

  const stages: Record<string, { label: string; color: string; order: number }> = {
    NOT_STARTED: { label: "Не начат", color: "#d1d5db", order: 0 },
    IN_PROGRESS: { label: "В работе", color: "#fbbf24", order: 1 },
    ISOLATED: { label: "Изолированно", color: "#60a5fa", order: 2 },
    SYLLABLES: { label: "В слогах", color: "#818cf8", order: 3 },
    WORDS: { label: "В словах", color: "#a78bfa", order: 4 },
    PHRASES: { label: "Во фразах", color: "#f472b6", order: 5 },
    SPEECH: { label: "В речи ✓", color: "#34d399", order: 6 },
  };

  const groups: Record<string, string[]> = {
    "Свистящие": ["С", "Сь", "З", "Зь", "Ц"],
    "Шипящие": ["Ш", "Ж", "Ч", "Щ"],
    "Сонорные": ["Л", "Ль", "Р", "Рь"],
  };

  const completedCount = client.soundProgress.filter(p => p.stage === "SPEECH").length;
  const inProgressCount = client.soundProgress.filter(p => p.stage !== "NOT_STARTED" && p.stage !== "SPEECH").length;
  const totalTracked = client.soundProgress.length;

  let progressTable = "";
  for (const [group, sounds] of Object.entries(groups)) {
    const groupSounds = client.soundProgress.filter(p => sounds.includes(p.sound));
    if (groupSounds.length === 0) continue;
    progressTable += `<div class="group-title">${group}</div><div class="progress-row">`;
    for (const sp of groupSounds) {
      const stage = stages[sp.stage] || stages.NOT_STARTED;
      progressTable += `<div class="sound-badge" style="background:${stage.color}20;border-color:${stage.color};color:${stage.color}"><strong>${sp.sound}</strong><br/><small>${stage.label}</small></div>`;
    }
    progressTable += `</div>`;
  }

  const sessionsInfo = client.sessions.length > 0
    ? `<p>Проведено занятий: <strong>${client.sessions.length}</strong> (показаны последние)</p>
       <div class="sessions-list">${client.sessions.slice(0, 10).map(s =>
         `<div class="session-item">${new Date(s.date).toLocaleDateString("ru-RU")} — ${s.startTime}, ${s.type}</div>`
       ).join("")}</div>`
    : "<p>Занятия ещё не проводились</p>";

  const latestCard = client.speechCards[0];
  let cardSummary = "";
  if (latestCard) {
    cardSummary = `<p>Последнее обследование: ${new Date(latestCard.date).toLocaleDateString("ru-RU", {day:"numeric",month:"long",year:"numeric"})}</p>`;
    if (latestCard.conclusion) cardSummary += `<div class="text-section">${latestCard.conclusion}</div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8">
<title>Отчёт — ${client.lastName} ${client.firstName}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; color: #5a4d8a; font-size: 22px; margin-bottom: 5px; }
  .subtitle { text-align: center; color: #6b7280; margin-bottom: 25px; }
  .stats { display: flex; gap: 15px; margin-bottom: 20px; }
  .stat-card { flex: 1; text-align: center; padding: 15px; border-radius: 12px; }
  .stat-card.green { background: #dcfce7; color: #166534; }
  .stat-card.yellow { background: #fef9c3; color: #854d0e; }
  .stat-card.blue { background: #dbeafe; color: #1e40af; }
  .stat-number { font-size: 28px; font-weight: 700; }
  .stat-label { font-size: 11px; }
  h2 { color: #5a4d8a; font-size: 16px; border-bottom: 2px solid #e8e4f0; padding-bottom: 5px; margin-top: 25px; }
  .group-title { font-weight: 600; margin-top: 12px; margin-bottom: 6px; color: #5a4d8a; }
  .progress-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .sound-badge { padding: 8px 12px; border-radius: 10px; border: 2px solid; text-align: center; min-width: 55px; font-size: 12px; }
  .sound-badge strong { font-size: 16px; }
  .text-section { padding: 10px; background: #f9f8fd; border-radius: 8px; margin-top: 5px; }
  .sessions-list { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px; }
  .session-item { font-size: 11px; padding: 4px 8px; background: #f0ece6; border-radius: 6px; }
  .print-btn { display: block; margin: 20px auto; padding: 10px 30px; background: #7c6bae; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .print-btn:hover { background: #5a4d8a; }
  @media print { .print-btn { display: none; } }
  .info { font-size: 12px; color: #6b7280; text-align: center; margin-top: 15px; }
</style></head><body>
<button class="print-btn" onclick="window.print()">Распечатать / Сохранить PDF</button>
<h1>Отчёт о прогрессе</h1>
<p class="subtitle">${client.lastName} ${client.firstName} ${client.patronymic}, ${ageYears} лет</p>
<div class="stats">
  <div class="stat-card green"><div class="stat-number">${completedCount}</div><div class="stat-label">Звуков поставлено</div></div>
  <div class="stat-card yellow"><div class="stat-number">${inProgressCount}</div><div class="stat-label">В работе</div></div>
  <div class="stat-card blue"><div class="stat-number">${client.sessions.length}</div><div class="stat-label">Занятий проведено</div></div>
</div>
${totalTracked > 0 ? `<h2>Прогресс по звукам</h2>${progressTable}` : ""}
${cardSummary ? `<h2>Последнее обследование</h2>${cardSummary}` : ""}
<h2>Занятия</h2>${sessionsInfo}
<p class="info">Отчёт сформирован: ${new Date().toLocaleDateString("ru-RU", {day:"numeric",month:"long",year:"numeric"})}</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
