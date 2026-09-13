# Аудит dsns-hub-admin

**Дата:** 13 сентября 2026  
**Репозиторий:** `dsns-hub-admin`  
**Тип:** Vite SPA, не Next.js · версия пакета `0.0.0`  
**Режим:** read-only на момент аудита

Смежные сервисы: `dsns-hub-backend`, `dsns-hub-mobile`.

---

## Самари

Веб-панель для ADMIN и SUPER_ADMIN: дашборд, пользователи, новости (TipTap + mobile preview), PDF, проекты, опросы, чаты, экстренные рассылки, профиль. SUPER_ADMIN: подразделения (DnD), audit, settings.

Стек свежий и последовательный: React 19, React Router 7, Zustand persist, axios, RHF + Zod, MUI 9, TipTap, DOMPurify, socket.io-client, Recharts, dnd-kit, Vitest. Архитектура простая: `pages` оркестрируют, `api/*` ходят в бекенд, диалоги по доменам.

Клиентская безопасность **выше среднего для SPA**: JWT не уходит на чужой origin, blob-картинки/видео/PDF, DOMPurify + YouTube sandbox, нет `dangerouslySetInnerHTML`, idle 15 мин, роль USER на логине сразу logout. Остаточный риск классический: **XSS = кража сессии из `localStorage`**, плюс CSP не попадает в `dist/`, нет CI, TypeScript без `strict`.

Зрелость: зрелая SPA; JWT в `localStorage`, нет CI.

---

## Метрики

| Метрика | Значение |
|---|---|
| Файлы `src/**/*.{ts,tsx}` | 94 |
| Страницы | 13 |
| API-модули | 14 |
| Компоненты | ~49 |
| Unit-тесты | 9 файлов / 31 тест |
| E2E | 0 |
| CI / Dockerfile | нет |
| `.env.example` | нет (README на него ссылается) |

---

## Маршруты

| Путь | Доступ |
|---|---|
| `/login` | public |
| `/`, `/users`, `/news`, `/documents`, `/projects`, `/polls`, `/chats`, `/broadcasts`, `/profile` | ADMIN+ |
| `/departments`, `/audit-logs`, `/settings` | SUPER_ADMIN (`PermissionGuard`) |

`ProtectedRoute` требует JWT **и** роль ADMIN/SUPER_ADMIN. Сайдбар прячет SUPER_ADMIN-пункты. Источник истины — бекенд.

---

## Сессия

1. Логин; если роль USER — logout на сервер, токены не пишутся.
2. `jwt_token` + `refresh_token` в `localStorage`; профиль в Zustand persist `auth_storage`.
3. 401 → очередь refresh; провал → `location.replace('/login')`.
4. Idle 15 мин → toast + logout.
5. После reload нет запроса `/users/me` — доверяют кэшу user + наличию access-токена.

---

## Находки

### HIGH

1. **JWT (access и refresh) в `localStorage`.** Любой XSS = полная сессия админа.  
   `src/utils/authStorage.ts:1-16`

2. **CSP только в `vite preview`.** `vite build` отдаёт голый `dist/`.  
   `vite.config.ts:13-38`

3. **Нет CI.** lint / test / build на PR не гоняются.

4. **`strict` TypeScript выключен.**  
   `tsconfig.app.json` — только unused locals/params, без `strict` / `noImplicitAny`.

5. **Роль в persist store подменяема.** UI можно «повысить»; API должен отсечь (и отсекает), но это не защита панели как UX.

### MEDIUM

6. Нет e2e и page tests при 13 экранах.
7. Ошибки часто только `console.error`; `getApiErrorMessage` почти не используется.
8. God pages: `Dashboard.tsx` 689, `News.tsx` 681, `Polls.tsx` 612, `Projects.tsx` 588, `Documents.tsx` 525.
9. `as any` в bulk-мутациях.
10. Нет `.env.example`.
11. IconButton без `aria-label` (grep находит aria в ~5 файлах).
12. Dashboard при падении API может показывать mock-график — риск принять фейк за метрики.
13. Preview CSP: `connect-src http: https: ws: wss:` слишком широкий.
14. Бандл: News ~540 kB, Dashboard ~407 kB (TipTap + Recharts + MUI).

### LOW

15. `ChatWindow` читает токен напрямую из `localStorage`, не через `getAccessToken()`.
16. Дубль `PermissionGuard` на роуте и на странице.
17. Нет 404 — `*` → `/`.
18. Polling дашборда раз в 60 с без `document.visibilityState`.
19. Oxlint-конфиг минимальный.

---

## Что хорошо

Единый `apiClient` с origin check и refresh queue; SecureImage / SecureVideo; TipTap `noopener` + http(s) only; ErrorBoundary; lazy pages; украинская локаль MUI; тесты на interceptors, sanitize, URL, idle, PermissionGuard, preview новостей; формы на Zod; 429 toast.

---

## Рекомендации

1. На проде: CSP/headers на nginx (как в preview, но узкий `connect-src`). Среднесрочно — httpOnly cookie + CSRF.
2. Включить `strict`.
3. CI: `oxlint` + `vitest run` + `tsc -b`.
4. Playwright smoke: login, users, news publish, settings.
5. Общий list-hook (pagination / search / bulk) вместо копипасты.
6. Добавить `.env.example`.
7. aria-label на иконки; не показывать mock как живые цифры.

---

Документ описывает состояние дерева **на 13 сентября 2026**.
