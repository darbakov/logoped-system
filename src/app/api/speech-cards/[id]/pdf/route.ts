import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const card = await prisma.speechCard.findFirst({
    where: { id: parseInt(id), client: { userId: user.id } },
    include: { client: true },
  });

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let soundTable = "";
  try {
    const sounds = JSON.parse(card.soundPronunciation);
    const groups: Record<string, string[]> = {
      "Свистящие": ["С", "Сь", "З", "Зь", "Ц"],
      "Шипящие": ["Ш", "Ж", "Ч", "Щ"],
      "Сонорные": ["Л", "Ль", "Р", "Рь"],
      "Заднеязычные": ["К", "Кь", "Г", "Гь", "Х", "Хь"],
      "Прочие": ["Й", "В", "Ф", "Б", "Д", "Т", "Н", "М"],
    };

    soundTable = `<table class="sound-table"><thead><tr><th>Группа</th><th>Звук</th><th>Состояние</th><th>Примечание</th></tr></thead><tbody>`;
    for (const [group, soundList] of Object.entries(groups)) {
      let first = true;
      for (const s of soundList) {
        const entry = sounds[s];
        if (!entry || (!entry.status && !entry.note)) continue;
        const status = typeof entry === "string" ? entry : entry.status || "";
        const note = typeof entry === "object" ? entry.note || "" : "";
        const statusClass = status === "норма" ? "status-ok" : status === "замена" ? "status-replace" : status === "искажение" ? "status-distort" : status === "отсутствие" ? "status-absent" : "";
        soundTable += `<tr><td>${first ? group : ""}</td><td class="sound-name">${s}</td><td class="${statusClass}">${status}</td><td>${note}</td></tr>`;
        first = false;
      }
    }
    soundTable += `</tbody></table>`;
  } catch {
    soundTable = "<p>Данные не заполнены</p>";
  }

  const birthDate = new Date(card.client.birthDate);
  const now = new Date(card.date);
  const ageYears = now.getFullYear() - birthDate.getFullYear();
  const cardDate = new Date(card.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Речевая карта — ${card.client.lastName} ${card.client.firstName}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 20px; text-align: center; color: #5a4d8a; margin-bottom: 5px; }
  .subtitle { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; padding: 15px; background: #f9f8fd; border-radius: 8px; }
  .info-item { font-size: 12px; }
  .info-label { color: #6b7280; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  h2 { font-size: 14px; color: #5a4d8a; border-bottom: 2px solid #e8e4f0; padding-bottom: 5px; margin-top: 20px; }
  .sound-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  .sound-table th, .sound-table td { border: 1px solid #e5e0d8; padding: 4px 8px; text-align: left; }
  .sound-table th { background: #f0ece6; font-weight: 600; }
  .sound-name { font-weight: 600; }
  .status-ok { color: #16a34a; }
  .status-replace { color: #ea580c; }
  .status-distort { color: #dc2626; }
  .status-absent { color: #991b1b; font-weight: 600; }
  .text-section { margin-top: 8px; padding: 10px; background: #fafaf8; border-radius: 6px; min-height: 30px; white-space: pre-wrap; }
  .conclusion { background: #f0ece6; font-weight: 500; }
  .print-btn { display: block; margin: 20px auto; padding: 10px 30px; background: #7c6bae; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }
  .print-btn:hover { background: #5a4d8a; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Распечатать / Сохранить PDF</button>
<h1>Речевая карта</h1>
<p class="subtitle">Дата обследования: ${cardDate}</p>
<div class="info-grid">
  <div class="info-item"><div class="info-label">ФИО ребёнка</div>${card.client.lastName} ${card.client.firstName} ${card.client.patronymic}</div>
  <div class="info-item"><div class="info-label">Возраст</div>${ageYears} лет (${birthDate.toLocaleDateString("ru-RU")})</div>
  <div class="info-item"><div class="info-label">Диагноз</div>${card.client.diagnosis}</div>
  <div class="info-item"><div class="info-label">Родитель</div>${card.client.parentName}, ${card.client.parentPhone}</div>
</div>
<h2>Звукопроизношение</h2>
${soundTable}
${card.phonematicHearing ? `<h2>Фонематический слух</h2><div class="text-section">${card.phonematicHearing}</div>` : ""}
${card.syllableStructure ? `<h2>Слоговая структура</h2><div class="text-section">${card.syllableStructure}</div>` : ""}
${card.vocabulary ? `<h2>Словарный запас</h2><div class="text-section">${card.vocabulary}</div>` : ""}
${card.grammar ? `<h2>Грамматический строй</h2><div class="text-section">${card.grammar}</div>` : ""}
${card.coherentSpeech ? `<h2>Связная речь</h2><div class="text-section">${card.coherentSpeech}</div>` : ""}
${card.conclusion ? `<h2>Заключение</h2><div class="text-section conclusion">${card.conclusion}</div>` : ""}
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
