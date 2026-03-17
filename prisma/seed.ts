import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // 1. Categories
  const articGym = await prisma.category.upsert({
    where: { id: 1 },
    create: { id: 1, name: "Артикуляционная гимнастика", parentId: null },
    update: { name: "Артикуляционная гимнастика", parentId: null },
  });

  const postanovka = await prisma.category.upsert({
    where: { id: 2 },
    create: { id: 2, name: "Постановка звуков", parentId: null },
    update: { name: "Постановка звуков", parentId: null },
  });

  const svistyashchie = await prisma.category.upsert({
    where: { id: 3 },
    create: { id: 3, name: "Свистящие", parentId: 2 },
    update: { name: "Свистящие", parentId: 2 },
  });

  const shipyashchie = await prisma.category.upsert({
    where: { id: 4 },
    create: { id: 4, name: "Шипящие", parentId: 2 },
    update: { name: "Шипящие", parentId: 2 },
  });

  const sonornye = await prisma.category.upsert({
    where: { id: 5 },
    create: { id: 5, name: "Сонорные", parentId: 2 },
    update: { name: "Сонорные", parentId: 2 },
  });

  const avtomatizaciya = await prisma.category.upsert({
    where: { id: 6 },
    create: { id: 6, name: "Автоматизация звуков", parentId: null },
    update: { name: "Автоматизация звуков", parentId: null },
  });

  const differenciaciya = await prisma.category.upsert({
    where: { id: 7 },
    create: { id: 7, name: "Дифференциация звуков", parentId: null },
    update: { name: "Дифференциация звуков", parentId: null },
  });

  const fonematicheskiy = await prisma.category.upsert({
    where: { id: 8 },
    create: { id: 8, name: "Фонематический слух", parentId: null },
    update: { name: "Фонематический слух", parentId: null },
  });

  const leksika = await prisma.category.upsert({
    where: { id: 9 },
    create: { id: 9, name: "Лексика и грамматика", parentId: null },
    update: { name: "Лексика и грамматика", parentId: null },
  });

  const svyaznaya = await prisma.category.upsert({
    where: { id: 10 },
    create: { id: 10, name: "Связная речь", parentId: null },
    update: { name: "Связная речь", parentId: null },
  });

  // 2. Exercises
  const exercisesData = [
    // Артикуляционная гимнастика
    {
      title: "Лягушка",
      description:
        "Улыбнуться, показать сомкнутые зубки. Удерживать 5-10 секунд.",
      categoryId: articGym.id,
      minAge: 3,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Хоботок",
      description:
        "Вытянуть сомкнутые губы вперёд трубочкой. Удерживать 5-10 секунд.",
      categoryId: articGym.id,
      minAge: 3,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Лопаточка",
      description:
        "Широкий расслабленный язык положить на нижнюю губу. Удерживать 10 секунд.",
      categoryId: articGym.id,
      minAge: 3,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Чашечка",
      description:
        "Широко открыть рот, края языка поднять вверх в форме чашечки.",
      categoryId: articGym.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Грибок",
      description:
        "Присосать язык к нёбу, открыть рот. Удерживать 5-10 секунд.",
      categoryId: articGym.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Лошадка",
      description:
        "Щёлкать языком, присасывая его к нёбу и резко отрывая.",
      categoryId: articGym.id,
      minAge: 3,
      maxAge: 7,
      targetSounds: "",
    },
    // Свистящие
    {
      title: "Постановка С от межзубного",
      description:
        "Просим ребёнка произнести межзубный С, затем убрать язык за зубы.",
      categoryId: svistyashchie.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "С",
    },
    {
      title: "Постановка З",
      description: "По подражанию от С с добавлением голоса.",
      categoryId: svistyashchie.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "З",
    },
    {
      title: "Постановка Ц",
      description: "Быстрое произнесение ТС.",
      categoryId: svistyashchie.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "Ц",
    },
    // Шипящие
    {
      title: "Постановка Ш от С",
      description: "Произнести С и сдвинуть язык назад.",
      categoryId: shipyashchie.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "Ш",
    },
    {
      title: "Постановка Ж от Ш",
      description: "Произнести Ш с добавлением голоса.",
      categoryId: shipyashchie.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "Ж",
    },
    // Сонорные
    {
      title: "Постановка Л",
      description: "Зажать кончик языка между зубами и произнести Ы.",
      categoryId: sonornye.id,
      minAge: 5,
      maxAge: 7,
      targetSounds: "Л",
    },
    {
      title: "Постановка Р от Д",
      description:
        "Быстро произносить Д-Д-Д, подкладывая палец под язык для вибрации.",
      categoryId: sonornye.id,
      minAge: 5,
      maxAge: 7,
      targetSounds: "Р",
    },
    // Автоматизация звуков
    {
      title: "Автоматизация С в слогах",
      description: "Произносить: СА-СО-СУ-СЫ, АС-ОС-УС.",
      categoryId: avtomatizaciya.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "С",
    },
    {
      title: "Автоматизация Р в словах",
      description: "Произносить слова: рак, рука, роза, ракета.",
      categoryId: avtomatizaciya.id,
      minAge: 5,
      maxAge: 7,
      targetSounds: "Р",
    },
    // Фонематический слух
    {
      title: "Поймай звук",
      description:
        "Хлопни в ладоши, когда услышишь звук С среди других звуков.",
      categoryId: fonematicheskiy.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Где спрятался звук",
      description:
        "Определи, в начале, середине или конце слова находится звук.",
      categoryId: fonematicheskiy.id,
      minAge: 5,
      maxAge: 7,
      targetSounds: "",
    },
    // Связная речь
    {
      title: "Расскажи по картинке",
      description:
        "Составить рассказ из 3-5 предложений по сюжетной картинке.",
      categoryId: svyaznaya.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "",
    },
    {
      title: "Перескажи сказку",
      description: "Пересказать знакомую сказку с опорой на картинки.",
      categoryId: svyaznaya.id,
      minAge: 4,
      maxAge: 7,
      targetSounds: "",
    },
  ];

  for (const ex of exercisesData) {
    const existing = await prisma.exercise.findFirst({
      where: { title: ex.title, categoryId: ex.categoryId },
    });
    if (!existing) {
      await prisma.exercise.create({ data: ex });
    }
  }

  // 3. Demo clients
  const client1 = await prisma.client.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      firstName: "Артём",
      lastName: "Иванов",
      patronymic: "Сергеевич",
      birthDate: new Date("2020-03-15"),
      parentName: "Иванова Елена Петровна",
      parentPhone: "+7 (999) 123-45-67",
      parentEmail: null,
      diagnosis: "ОНР III уровня, дизартрия",
      source: "PRIVATE",
      status: "ACTIVE",
    },
    update: {
      firstName: "Артём",
      lastName: "Иванов",
      patronymic: "Сергеевич",
      birthDate: new Date("2020-03-15"),
      parentName: "Иванова Елена Петровна",
      parentPhone: "+7 (999) 123-45-67",
      diagnosis: "ОНР III уровня, дизартрия",
      source: "PRIVATE",
      status: "ACTIVE",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 2 },
    create: {
      id: 2,
      firstName: "Мария",
      lastName: "Петрова",
      patronymic: "Ивановна",
      birthDate: new Date("2019-08-22"),
      parentName: "Петрова Анна Викторовна",
      parentPhone: "+7 (916) 555-33-22",
      parentEmail: null,
      diagnosis: "ФФНР, дислалия",
      source: "INSTITUTION",
      status: "ACTIVE",
    },
    update: {
      firstName: "Мария",
      lastName: "Петрова",
      patronymic: "Ивановна",
      birthDate: new Date("2019-08-22"),
      parentName: "Петрова Анна Викторовна",
      parentPhone: "+7 (916) 555-33-22",
      diagnosis: "ФФНР, дислалия",
      source: "INSTITUTION",
      status: "ACTIVE",
    },
  });

  // 4. Demo sessions
  const now = new Date();
  const sessionsData = [
    // Client 1 - Иванов Артём
    {
      clientId: client1.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      startTime: "10:00",
      duration: 30,
      type: "Индивидуальное",
      status: "COMPLETED",
    },
    {
      clientId: client1.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      startTime: "10:00",
      duration: 30,
      type: "Индивидуальное",
      status: "COMPLETED",
    },
    {
      clientId: client1.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      startTime: "10:00",
      duration: 30,
      type: "Индивидуальное",
      status: "COMPLETED",
    },
    {
      clientId: client1.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
      startTime: "10:00",
      duration: 30,
      type: "Индивидуальное",
      status: "PLANNED",
    },
    // Client 2 - Петрова Мария
    {
      clientId: client2.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 21),
      startTime: "11:00",
      duration: 30,
      type: "Индивидуальное",
      status: "COMPLETED",
    },
    {
      clientId: client2.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      startTime: "11:00",
      duration: 30,
      type: "Индивидуальное",
      status: "COMPLETED",
    },
    {
      clientId: client2.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      startTime: "11:00",
      duration: 30,
      type: "Индивидуальное",
      status: "PLANNED",
    },
    {
      clientId: client2.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      startTime: "11:00",
      duration: 30,
      type: "Индивидуальное",
      status: "PLANNED",
    },
  ];

  for (const s of sessionsData) {
    const existing = await prisma.session.findFirst({
      where: { clientId: s.clientId, date: s.date, startTime: s.startTime },
    });
    if (!existing) {
      await prisma.session.create({ data: s });
    }
  }

  // 5. Session exercises - link some exercises to sessions
  const sessions = await prisma.session.findMany({
    where: { clientId: { in: [client1.id, client2.id] } },
    orderBy: { date: "asc" },
  });
  const exercises = await prisma.exercise.findMany({ take: 10 });

  for (let i = 0; i < Math.min(sessions.length, 4); i++) {
    const session = sessions[i];
    const ex1 = exercises[i % exercises.length];
    const ex2 = exercises[(i + 1) % exercises.length];
    await prisma.sessionExercise.upsert({
      where: {
        sessionId_exerciseId: {
          sessionId: session.id,
          exerciseId: ex1.id,
        },
      },
      create: {
        sessionId: session.id,
        exerciseId: ex1.id,
      },
      update: {},
    });
    if (ex1.id !== ex2.id) {
      await prisma.sessionExercise.upsert({
        where: {
          sessionId_exerciseId: {
            sessionId: session.id,
            exerciseId: ex2.id,
          },
        },
        create: {
          sessionId: session.id,
          exerciseId: ex2.id,
        },
        update: {},
      });
    }
  }

  // 6. Sound progress for first client (Иванов Артём)
  const soundProgressData = [
    { clientId: client1.id, sound: "С", stage: "WORDS" },
    { clientId: client1.id, sound: "З", stage: "SYLLABLES" },
    { clientId: client1.id, sound: "Р", stage: "IN_PROGRESS" },
    { clientId: client1.id, sound: "Л", stage: "ISOLATED" },
    { clientId: client1.id, sound: "Ш", stage: "NOT_STARTED" },
  ];

  for (const sp of soundProgressData) {
    await prisma.soundProgress.upsert({
      where: {
        clientId_sound: { clientId: sp.clientId, sound: sp.sound },
      },
      create: sp,
      update: { stage: sp.stage },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
