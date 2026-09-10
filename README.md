# DSNS Hub Admin

Адмін-панель внутрішньої платформи **DSNS Hub** для ДСНС України. Це веб-клієнт для адміністраторів і суперадміністраторів: керування користувачами, контентом, підрозділами, чатами, екстреними розсилками та системними налаштуваннями.

Панель працює лише з бекендом DSNS Hub. Мобільний застосунок (`dsns-hub-mobile`) читає той самий API — зміни статусів новин, документів, проєктів і опитувань одразу впливають на користувачів у полі.

Репозиторій: [ScreaMonhik/dsns-hub-admin](https://github.com/ScreaMonhik/dsns-hub-admin)

---

## Зміст

- [Що вміє панель](#що-вміє-панель)
- [Ролі та доступ](#ролі-та-доступ)
- [Стек](#стек)
- [Архітектура](#архітектура)
- [Маршрути](#маршрути)
- [Авторизація](#авторизація)
- [Безпека](#безпека)
- [Запуск](#запуск)
- [Змінні середовища](#змінні-середовища)
- [Скрипти](#скрипти)
- [API-клієнт](#api-клієнт)
- [Тести](#тести)
- [Збірка та preview](#збірка-та-preview)
- [Узгодження з бекендом](#узгодження-з-бекендом)

---

## Що вміє панель

### Головна (`/`)

Дашборд аналітики: кількість користувачів, проєктів, новин, опитувань, графік активності, останні реєстрації та чернетки, що чекають публікації. Можна фільтрувати період і експортувати звіт у CSV або PDF.

### Користувачі (`/users`)

Створення, редагування, блокування та видалення облікових записів. Пошук, пагінація, масові дії. Скидання пароля з тимчасовим паролем. Перегляд і відкликання активних сесій користувача.

Вхід дозволений лише для домену `@dsns.gov.ua`. Пароль нового користувача: мінімум 8 символів, велика й мала літери, цифра, спецсимвол.

### Новини (`/news`)

Редактура новин зі статусами `DRAFT`, `PUBLISHED`, `SCHEDULED`, `ARCHIVED`. Категорії (створення, перейменування, видалення, drag-and-drop порядок). Прив’язка до підрозділів. Обкладинка, коментарі, лайки.

Текст редагується в **TipTap** і зберігається як JSON: заголовки H2/H3, списки, вирівнювання, посилання, зображення, відео з диска, YouTube. Перед показом HTML проходить через DOMPurify; у iframe дозволений лише YouTube.

Праворуч у формі створення/редагування — живе прев’ю (`NewsMobilePreview`): той самий екран, що `NewsDetailScreen` у `dsns-hub-mobile` (шапка «Новина», категорія, дата публікації, заголовок, обкладинка, тіло, лайки/коментарі). Тема прев’ю береться з теми адмінки (світла/темна). YouTube у прев’ю — вбудований плеєр 16:9, як у застосунку.

### Документи (`/documents`) і проєкти (`/projects`)

PDF-документи та проєкти зі статусами `DRAFT` / `PUBLISHED` / `ARCHIVED`. Фільтри за підрозділом і пошуком, таблиця або сітка, перегляд PDF у новій вкладці (файл качається з API з JWT, відкривається як blob з `noopener`). У проєктах є коментарі та голосування.

### Опитування (`/polls`)

Створення опитувань з варіантами відповідей, терміном дії, видимістю для підрозділів, публікацією та архівацією. Перегляд результатів (кількість голосів).

### Чати (`/chats`)

Групові чати підрозділів. Історія повідомлень через REST, живі повідомлення через **Socket.IO** (`/chat`, transport `websocket`, JWT у `auth.token`). Керування учасниками, роллю адміна кімнати, аватаром групи.

### Розсилки (`/broadcasts`)

Екстрені push-розсилки в мобільний застосунок: заголовок, текст, рівень (`INFO` / `WARNING` / `CRITICAL`), звук (`DEFAULT` / `SIREN` / `ALERT`), цільові підрозділи. Історія відправок і статус `SENT` / `FAILED` / `PENDING`.

### Профіль (`/profile`)

Аватар, зміна пароля, журнал власних дій, активні сесії (відкликати одну або всі інші).

### Лише SUPER_ADMIN

| Сторінка | Що робить |
| --- | --- |
| `/departments` | Дерево підрозділів, вкладеність, drag-and-drop порядок, JSON-експорт |
| `/audit-logs` | Журнал дій (`CREATE` / `UPDATE` / `DELETE` / `LOGIN` / `EXPORT`), фільтри, експорт CSV/PDF |
| `/settings` | Режим обслуговування, глобальний банер, ліміти розміру PDF і медіа |

Глобальний банер з налаштувань показується всім адмінам у шапці робочої зони.

---

## Ролі та доступ

| Роль | Вхід у панель | Основні розділи | Підрозділи, аудит, settings |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | так | усі | так |
| `ADMIN` | так | усі, крім трьох SUPER_ADMIN-сторінок | ні (редірект на `/`) |
| `USER` | ні | — | — |

Перевірка на клієнті:

1. `ProtectedRoute` — є JWT **і** роль `ADMIN` або `SUPER_ADMIN`.
2. `PermissionGuard` на маршрутах `/departments`, `/audit-logs`, `/settings`.
3. Сайдбар ховає SUPER_ADMIN-пункти для звичайного адміна.

Остаточний контроль прав — на бекенді. Клієнтська роль у `localStorage` не є джерелом істини.

---

## Стек

| Шар | Технології |
| --- | --- |
| UI | React 19, TypeScript, MUI 9, Emotion, Roboto, українська локаль `ukUA` |
| Маршрутизація | React Router 7, `React.lazy` + `Suspense` для сторінок |
| Стан | Zustand (`authStore`, `themeStore`) з persist |
| Форми | react-hook-form + Zod |
| HTTP | Axios, один `apiClient` з interceptors |
| Реалтайм | socket.io-client |
| Редактор | TipTap + DOMPurify |
| Графіки | Recharts |
| DnD | @dnd-kit (дерево підрозділів, порядок категорій) |
| Збірка | Vite 8, `@vitejs/plugin-react` |
| Якість | Vitest + Testing Library + jsdom, Oxlint |

Тема світла/темна зберігається в `theme_storage`. Інтерфейс українською.

---

## Архітектура

```
src/
  api/                 # HTTP-модулі за доменами (users, news, chats, …)
  components/
    layout/            # Header, Sidebar, AdminLayout, банер, хлібні крихти
    common/            # PermissionGuard, SecureImage, ErrorBoundary, bulk-дії
    news|users|…/      # Діалоги розділу; у news — TipTap + NewsMobilePreview
  hooks/               # useCan, useIdleTimer
  pages/               # Екрани маршрутів (ліниве завантаження)
  routes/              # ProtectedRoute
  store/               # Zustand: auth і тема
  utils/               # URL/origin-перевірки, authStorage, sanitizeHtml
```

Принципи:

- Сторінка збирає дані й оркеструє діалоги; запити живуть у `src/api/*`.
- Медіа з API (`/uploads/…`, `/news/media/…`, PDF) вантажаться через `apiClient` як blob і показуються в `SecureImage` або новій вкладці. Зовнішні origin не отримують JWT.
- Форми валідуються Zod до відправки.
- Помилки UI ловить `ErrorBoundary` у `main.tsx`.

---

## Маршрути

| Шлях | Компонент | Хто бачить |
| --- | --- | --- |
| `/login` | `Login` | усі (публічний) |
| `/` | `Dashboard` | ADMIN+ |
| `/users` | `Users` | ADMIN+ |
| `/news` | `News` | ADMIN+ |
| `/documents` | `Documents` | ADMIN+ |
| `/projects` | `Projects` | ADMIN+ |
| `/polls` | `Polls` | ADMIN+ |
| `/chats` | `Chats` | ADMIN+ |
| `/broadcasts` | `Broadcasts` | ADMIN+ |
| `/profile` | `Profile` | ADMIN+ |
| `/departments` | `Departments` | SUPER_ADMIN |
| `/audit-logs` | `AuditLogs` | SUPER_ADMIN |
| `/settings` | `Settings` | SUPER_ADMIN |
| `*` | редірект на `/` | — |

Невідомий шлях веде на `/`. Якщо користувач не авторизований — на `/login`.

---

## Авторизація

1. `POST /auth/login` з email `@dsns.gov.ua` і паролем.
2. Якщо роль не `ADMIN`/`SUPER_ADMIN`, панель викликає `POST /auth/logout` з отриманим access-токеном і показує відмову. Токени в storage не зберігаються.
3. Інакше `setAuth` пише `jwt_token`, `refresh_token` і профіль користувача (`auth_storage` — лише `user`).
4. Кожен внутрішній запит отримує `Authorization: Bearer <access>`.
5. На `401` (крім `/auth/login|refresh|register|logout`) клієнт робить `POST /auth/refresh`. Черга паралельних запитів чекає новий токен. Невдача — повне очищення storage і `location.replace('/login')`.
6. Через **15 хвилин** без активності (`mousemove`, `keydown`, `scroll`, …) сесія завершується: toast і `logout`.
7. Після перезавантаження сторінки `isAuthenticated` відновлюється лише якщо є і профіль, і access-токен.

Токени лежать у `localStorage` (SPA без httpOnly cookie). XSS на панелі = ризик крадіжки сесії; тому санітизація HTML і заборона JWT на чужі origin критичні.

---

## Безпека

Реалізовано на клієнті (сервер усе одно має дублювати правила):

- JWT не додається до запитів на чужий origin.
- `fileUrl` / `src` зображень мають бути відносним шляхом API або абсолютним URL того ж origin. `javascript:`, `//evil.com`, path traversal відсікаються.
- TipTap: протоколи посилань лише `http`/`https`, `rel="noopener noreferrer nofollow"`, YouTube-URL перевіряється перед вставкою.
- DOMPurify: довільні iframe прибираються, YouTube залишається з `sandbox`.
- PDF відкривається через `window.open(..., 'noopener,noreferrer')`.
- Завантаження файлів обмежені MIME: зображення JPEG/PNG/WebP, відео MP4/WebM/OGG, документи PDF.
- Preview (`vite preview`) віддає CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- У `index.html`: `noindex, nofollow` і `referrer: strict-origin-when-cross-origin`.
- Повідомлення помилки логіна не прокидає сирий текст з API в UI.

---

## Запуск

Потрібні **Node.js 20+** і запущений **dsns-hub-backend** (типово `http://localhost:3000`).

```bash
git clone https://github.com/ScreaMonhik/dsns-hub-admin.git
cd dsns-hub-admin
npm install
cp .env.example .env   # якщо файлу ще немає — створіть його вручну
npm run dev
```

Vite підніме HMR-сервер (зазвичай `http://localhost:5173`). Увійдіть обліковкою `ADMIN` або `SUPER_ADMIN` з домену `@dsns.gov.ua`.

---

## Змінні середовища

Файл `.env` у корені (не комітиться):

```env
# Базовий URL NestJS API без слеша в кінці
VITE_API_URL=http://localhost:3000
```

Якщо змінна не задана, клієнт падає на `http://localhost:3000`. Префікс `VITE_` обов’язковий: Vite підставляє значення в бандл на етапі збірки.

Для production вкажіть HTTPS-адресу API, з якої браузер реально ходить на бекенд (CORS має дозволяти origin адмінки).

---

## Скрипти

| Команда | Дія |
| --- | --- |
| `npm run dev` | dev-сервер Vite |
| `npm run build` | `tsc -b` і production-бандл у `dist/` |
| `npm run preview` | локальний перегляд `dist` із security-заголовками та CSP |
| `npm run lint` | Oxlint |
| `npm test` | Vitest у watch-режимі |
| `npx vitest run` | одноразовий прогін тестів |
| `npm run test:ui` | UI Vitest |
| `npm run test:coverage` | покриття (потрібен `@vitest/coverage-*`, якщо підключено) |

---

## API-клієнт

Єдиний Axios-інстанс: `src/api/apiClient.ts`.

| Модуль | Префікс API |
| --- | --- |
| `usersApi` | `/users`, `/users/me/password`, `/users/me/avatar` |
| `newsApi` | `/news`, `/news/categories`, `/news/upload`, `/news/:id/comments` |
| `documentsApi` | `/documents`, `/documents/:id/file`, publish/archive |
| `projectsApi` | `/projects`, download, publish/archive, коментарі/голоси |
| `pollsApi` | `/polls` |
| `chatsApi` | `/chat/groups`, members, messages |
| `broadcastsApi` | `/emergency-broadcasts` |
| `departmentsApi` | `/departments`, reorder, `export-json` |
| `auditApi` | `/audit-logs`, `/audit-logs/export` |
| `analyticsApi` | `/analytics/dashboard`, `/analytics/export` |
| `settingsApi` | `/settings` |
| `sessionsApi` | `/auth/sessions`, `/users/:id/sessions` |

На `429` показується toast «Забагато запитів». Медіа й PDF йдуть з `responseType: 'blob'` і попередньою перевіркою `toApiRequestUrl()`.

Socket чату: `io(`${VITE_API_URL}/chat`, { auth: { token }, transports: ['websocket'] })`. Події: `joinRoom`, `sendMessage`, `newMessage`, `exception`.

---

## Тести

Vitest + jsdom + Testing Library. Конфіг у `vite.config.ts` (`setupFiles: src/setupTests.ts`).

Покрито зараз:

- interceptors `apiClient` (JWT лише на API origin, 401/429, skip refresh на `/auth/login`)
- `authStore` (setAuth / logout)
- `useCan`, `PermissionGuard`, `useIdleTimer`
- хелпери URL і DOMPurify (`src/utils/*.test.ts`)

Нові утиліти безпеки варто супроводжувати тестом у тому ж стилі: `describe` українською/англійською, моки `localStorage` і `window.location`.

---

## Збірка та preview

```bash
npm run build
npm run preview
```

`dist/` — статичний SPA. Хостинг має:

1. Віддавати `index.html` для всіх клієнтських маршрутів (fallback).
2. Бажано повторити заголовки з `vite.config.ts` (`X-Frame-Options`, CSP, `nosniff`). CSP у `vite preview` уже ввімкнений; на nginx/Cloudflare його треба задати окремо.
3. Не викладати `.env` і не світити секрети в клієнтському бандлі — у фронті може бути лише публічний `VITE_API_URL`.

---

## Узгодження з бекендом

Адмінка очікує, що API:

- віддає access + refresh токени і об’єкт `user` з `role`;
- зберігає медіа як відносні шляхи (`/uploads/…`, `/news/media/…`, `/documents/download/…`);
- вимагає Bearer JWT на захищених роутах і перевіряє роль на кожній мутації;
- піднімає Socket.IO namespace `/chat`;
- коректно відповідає `401` / `403` / `429`.

Зміни контракту (нові поля статусів, інші шляхи файлів, cookie-сесії) треба проводити синхронно в `dsns-hub-backend` і в мобільному клієнті.

---

## Ліцензія

Приватний внутрішній проєкт. Не публікувати збірку й облікові дані за межі контуру ДСНС.
