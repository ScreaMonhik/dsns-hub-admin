# dsns-hub-admin — що зроблено

Гілка: `feat/http-only-cookies-and-forced-password`  
Дата: 13 вересня 2026  
Контекст: правки за [AUDIT.md](./AUDIT.md) (пункти P6, P8, P9) і спільний cookie-контур з backend.

## Навіщо

Адмінка тримала access і refresh JWT у `localStorage`. Це б’ється XSS: скрипт на сторінці міг викрасти сесію. CSP був лише на `vite preview`, CI не було.

## Сесія без токенів у сховищі

- Axios ходить на API з `withCredentials: true`. Заголовок `Authorization` для внутрішніх запитів більше не ставиться.
- Refresh: `POST /auth/refresh` порожнім тілом, cookie підхоплює браузер.
- У `sessionStorage` лишається лише профіль користувача + прапорець `dsns_session`. Після закриття вкладки сесія в браузері зникає; cookie живе за TTL бекенда.
- При logout чистяться і нові ключі, і легасі `jwt_token` / `refresh_token` з `localStorage`.
- Socket.IO чату теж на `withCredentials`, без токена в `auth`.

Потрібен спільний cookie-домен з API (`COOKIE_DOMAIN` на бекенді, CORS `credentials: true`).

## Примусова зміна пароля

- Якщо `user.forcePasswordChange`, `ProtectedRoute` пускає лише `/profile`.
- Сайдбар блокує інші пункти. Логін одразу веде в профіль.
- У профілі — попередження, активна лише вкладка «Безпека». Після успішної зміни пароля прапорець скидається.
- `403` з кодом `FORCE_PASSWORD_CHANGE` редіректить на профіль.

## Інше

- CSP мета-тег додається в HTML і в dev, не лише в preview.
- Аватари в коментарях новин ідуть через `SecureImage` (blob + JWT/cookie), а не як публічний `<img src>`.
- TipTap піднято до `3.31.3` (`@tiptap/core` + `@tiptap/pm`).
- CI: lint, `npm audit --audit-level=high`, vitest, build.
- Dependabot: щотижневі npm і GitHub Actions.
- Тести: `ProtectedRoute`, auth store, apiClient, sanitizeHtml, url.

## Як перевірити

```bash
npm ci
npx vitest run
npm run build
```

У браузері: залогінитись, у DevTools → Application не повинно бути `jwt_token` / `refresh_token` у `localStorage`; мають бути httpOnly cookies `dsns_access` і `dsns_refresh`.
