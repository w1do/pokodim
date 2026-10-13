## Why

Проект pokodim.рф вырос без единого стандарта: относительные импорты, три копии сетевого кода, фильтры каталога на DOM-скриптах, нет линтеров и тестов. Аудит нашёл ошибки, которые уже приводят к потере материалов на сайте (CMS отдаёт посты курсором, а сборка читает только первую страницу). Пока код небольшой, дешевле привести его к единому стандарту сейчас, чем переписывать позже.

## What Changes

- Ввести единую структуру папок по FSD (`app`, `views`, `widgets`, `features`, `entities`, `shared`), алиас `@/*`, порядок импортов и лимит 150 строк на файл; ESLint и Vitest в CI.
- Ввести единый слой доступа к CMS: один `useApi()` + TanStack Query для всех React-островов; build-time код Astro использует тот же клиент (`getApi()`).
- Перевести каталог на React-остров: серверные фильтры (`category`, `tag`), cursor-пагинация «Показать ещё» через `useInfiniteQuery`, состояние фильтров в URL, `initialData` из SSG.
- Добавить единые лоадеры: `Button` с `loading`, `Spinner`, `Skeleton`/`CardSkeleton`, `PageLoader`, глобальная полоса прогресса.
- Сложные и интерактивные компоненты — только React (`.tsx`); `.astro` — статическая обвязка.
- Fail-fast на сборке: отсутствие env, `401`, пустой ответ CMS — ошибка сборки вместо пустого каталога.
- **BREAKING**: удаляются `src/lib/cms.ts`, `src/lib/catalog.ts`, `src/lib/catalog-client.ts`, inline-скрипты `FilterBar.astro`/`SearchBox.astro`; переменные `BACKEND_API`/`BACKEND_KEY` остаются, но читаются через схему `astro:env` и должны содержать `public`-ключ (`pk_…`).

### Решения пользователя

- Рендер: **SSG + React-острова**. Страницы и SEO остаются статикой Astro; каталог, фильтры, поиск, «Показать ещё», кнопки — React-острова.
- Каталог: **серверные фильтры + «Показать ещё»**; поиск по заголовку/описанию — на клиенте среди загруженных (серверного поиска в CMS нет).

### Критические находки аудита

1. **Потеря материалов.** `fetchPosts()` читает только первую страницу (`cursor` игнорируется) и используется в `index.astro`, `materials/index.astro` и `getStaticPaths` страницы `materials/[slug].astro`. Материалы со второй страницы CMS не попадут на сайт и не получат собственных страниц.
2. **Тихие отказы.** Ошибка, `401` или отсутствие env превращаются в `[]` + `console.warn`; CI с неверными секретами собирает пустой каталог и остаётся зелёным.
3. **Три копии сетевого кода** (`requestJson`, `fetchPosts`, `fetchPostsByParams`): нет таймаута, `AbortSignal`, обработки `429/503` с `Retry-After`, разбора конверта ошибки `{error:{code,…}}`.
4. **Каталог на DOM-хаках.** Фильтры и поиск — два inline-`<script>` + `lib/catalog-client.ts` через `data-*` и `hidden`; нет пагинации, состояний загрузки/ошибки, тестируемости.
5. **Хрупкие выводы.** Инструмент берётся из `post.path.split('/')[2]`; уровни — захардкоженный `LEVELS`.
6. **Env без схемы.** `import.meta.env.BACKEND_KEY as string | undefined`; в браузер ключ не попадает; нет проверки, что ключ публичный.
7. **Свой Markdown-рендер** (`lib/markdown.ts`) + `set:html`: ручной парсер без тестов, растущий XSS-риск.
8. **Структура и стиль.** Относительные импорты `../../lib/…`, нет алиасов, ESLint/Prettier/тестов; CI — только `astro check` + build; захардкоженные цвета (`#303a49` и др.) при наличии токенов; `[slug].astro` ровно 150 строк, `design.css` 148, `home-hero.css` 146 — на пределе лимита.
9. **Локаль** `'ru'` зашита в нескольких местах.
10. **`@cms/api-client`**: реестр GitLab отвечает `401` без токена — доступ не подтверждён, нужен fallback.

## Capabilities

### New Capabilities
- `project-conventions`: слои FSD, алиасы, порядок импортов, лимит 150 строк, конфиги в `shared/config`, React для сложных компонентов, линтеры и проверки в CI.
- `api-data-layer`: единый клиент CMS, `useApi()`/`getApi()`, `ApiError`, повторы по `Retry-After`, публичный ключ, fail-fast сборки.
- `catalog-data-loading`: каталог на `useInfiniteQuery`, «Показать ещё», серверные фильтры, URL-состояние, `initialData` из SSG, пустое состояние и ошибка.
- `loading-states`: `Button loading`, `Spinner`, скелетоны, `PageLoader`, глобальная полоса прогресса, доступность.

### Modified Capabilities
<!-- Основной каталог openspec/specs пуст; существующие изменения add-mvp-home-catalog и polish-pokodim-visual-design не архивированы и не затрагиваются. -->

## Impact

- Код: все файлы `src/` (перенос по слоям), `astro.config.mjs` (`@astrojs/react`, `env.schema`), `tsconfig.json` (`paths`, `jsx`), `package.json` (react, react-dom, `@astrojs/react`, `@tanstack/react-query`, ESLint, Vitest), `.github/workflows/ci.yml` (`lint`, `test`).
- Внешние системы: только CMS `/api/v1/*` с заголовком `X-Api-Key` (`public`-ключ); `/api/admin/v1/*` не используется.
- Зависимости: возможен приватный пакет `@cms/api-client` (токен реестра — вне git) либо локальный транспорт с тем же интерфейсом.
- Вне объёма: новый дизайн, SEO-мета, оплата, авторизация, заявки, свой backend, локальный JSON как источник данных.
