# ЛогоПро — Система для логопеда

Комплексная веб-система для логопедов: учёт учеников, расписание, речевые карты, отслеживание прогресса, домашние задания и финансы.

## Технологии

- **Next.js 16** (App Router, SSR)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma** + SQLite
- **Auth.js v5** (аутентификация)
- **Docker** (развёртывание)

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Настройка базы данных
npx prisma migrate dev

# Наполнение демо-данными
npx tsx prisma/seed.ts

# Запуск
npm run dev
```

Приложение доступно на http://localhost:3000

## Развёртывание на Reg.ru

### 1. Арендовать VPS на Reg.ru

1. Перейти на [Reg.ru](https://www.reg.ru/?rlink=reflink-11085247)
2. Выбрать **Облачные серверы** (Cloud VPS)
3. Выбрать тариф **Cloud-1** (1 ГБ RAM, 1 vCPU) — этого хватит для ЛогоПро
4. ОС: **Ubuntu 24.04**
5. После создания сервера вы получите IP-адрес и пароль root

### 2. Подключиться к серверу и установить Docker

```bash
# Подключиться по SSH (Windows — через PowerShell или PuTTY)
ssh root@ваш-ip

# Обновить систему
apt update && apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com | sh

# Установить Docker Compose
apt install docker-compose-plugin -y

# Установить Git
apt install git -y
```

### 3. Загрузить проект на сервер

**Вариант A: через Git (рекомендуется)**

```bash
# На сервере
git clone https://github.com/ваш-аккаунт/logoped-system.git
cd logoped-system
```

**Вариант B: через SCP (без Git)**

```bash
# На вашем компьютере (PowerShell)
scp -r logoped-system root@ваш-ip:/root/

# На сервере
cd /root/logoped-system
```

### 4. Настроить переменные окружения

```bash
# Скопировать шаблон
cp .env.example .env

# Сгенерировать секретный ключ и записать в .env
sed -i "s/your-secret-here/$(openssl rand -hex 32)/" .env
```

Если домена пока нет, отредактировать NEXTAUTH_URL:
```bash
sed -i "s|https://your-domain.com|http://ваш-ip:3000|" .env
```

Если домен есть:
```bash
sed -i "s|https://your-domain.com|https://ваш-домен.ru|" .env
```

### 5. Запустить

```bash
docker compose up -d --build
```

Первая сборка займёт 2-5 минут. После этого приложение доступно:
- Без домена: `http://ваш-ip` (порт 80)
- С доменом: `https://ваш-домен.ru`

### 6. Настроить домен (опционально)

**Купить домен на Reg.ru:**
1. В личном кабинете Reg.ru перейти в **Домены** → **Регистрация**
2. Найти и купить подходящий домен

**Привязать домен к серверу:**
1. В настройках домена на Reg.ru перейти в **DNS-серверы и управление зоной**
2. Добавить **A-запись**: `@` → IP вашего сервера
3. Добавить **A-запись**: `www` → IP вашего сервера
4. Подождать 5-30 минут (обновление DNS)

**Получить SSL-сертификат (HTTPS):**

```bash
# На сервере
docker compose run --rm certbot certonly \
  --webroot -w /var/lib/letsencrypt \
  -d ваш-домен.ru -d www.ваш-домен.ru \
  --email ваш-email@mail.ru --agree-tos
```

Обновить `nginx.conf` — заменить содержимое на:

```nginx
server {
    listen 443 ssl;
    server_name ваш-домен.ru www.ваш-домен.ru;

    ssl_certificate /etc/letsencrypt/live/ваш-домен.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ваш-домен.ru/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

Перезапустить:
```bash
docker compose restart nginx
```

Не забудь обновить `.env`:
```bash
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://ваш-домен.ru|" .env
docker compose up -d
```

### Бэкап базы данных

```bash
# Скопировать БД с сервера на локальный компьютер
scp root@ваш-ip:/var/lib/docker/volumes/logoped-system_app-data/_data/logopro.db ./backup.db

# Или через docker
docker cp logoped-system-app-1:/app/data/logopro.db ./backup.db
```

### Обновление приложения

```bash
# На сервере
cd /root/logoped-system
git pull
docker compose up -d --build
```

### Полезные команды

```bash
# Посмотреть логи приложения
docker compose logs -f app

# Перезапустить всё
docker compose restart

# Остановить
docker compose down

# Проверить статус
docker compose ps
```

## Модули системы

| Модуль | Описание |
|--------|----------|
| Ученики | Карточки учеников, контакты родителей, диагнозы |
| Расписание | Недельный календарь, повторяющиеся занятия |
| Речевые карты | Обследование, звукопроизношение, экспорт в PDF |
| Упражнения | Библиотека упражнений по категориям |
| Домашние задания | Назначение и отслеживание домашней работы |
| Прогресс | Отслеживание звуков по этапам, отчёты для родителей |
| Финансы | Учёт оплат, баланс по ученикам |
