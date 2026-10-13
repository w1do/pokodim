# Verification — add-mvp-home-catalog

Дата: 2026-10-07. Окружение: Node v26.5.0, npm 11.17.0, Astro 7.3.6.

## Автоматические проверки

- `npm ci` → exit 0.
- `npx astro check` → 0 errors, 0 warnings, 0 hints (15 files).
- `npm run build` → exit 0, 9 pages built (`, /materials/`, 6 страниц материалов, `404.html`).
- `wc -l` по всем файлам `src/**` → максимум 146 строк (`src/pages/index.astro`), все ≤ 150.

## Сценарии (Playwright + Chromium, `astro preview` :4330) — 17/17 PASS

| # | Сценарий | Результат |
|---|----------|-----------|
| 1 | Главная: hero с ключевым сообщением | PASS |
| 2 | Главная: тёмная тема (`background-color: rgb(11,15,20)`) | PASS |
| 3 | Главная: навигация по разделам (якоря `#instructions` и др.) | PASS |
| 4 | Главная: подборка 4 карточки (featured первым) | PASS |
| 5 | Переход «Каталог материалов» → `/materials/` | PASS |
| 6 | Каталог: 6 карточек | PASS |
| 7 | Фильтр `tool=claude-code` → 1 карточка | PASS |
| 8 | Фильтр в URL query | PASS |
| 9 | Перезагрузка страницы сохраняет фильтр | PASS |
| 10 | «Сбросить» → 6 карточек | PASS |
| 11 | Фильтр `level=продвинутый` → 2 карточки | PASS |
| 12 | Поиск «Gemma» → 1 карточка | PASS |
| 13 | Пустой результат поиска → «Ничего не найдено» | PASS |
| 14 | Страница материала: текст из CMS | PASS |
| 15 | Страница материала: тег инструмента | PASS |
| 16 | Несуществующий slug → HTTP 404 | PASS |
| 17 | Страница 404: контент и ссылки | PASS |

## Данные CMS (backend.w1do.ru, проект `pokodim`)

- Сервис `content` включён; активен public-ключ (значение — только в `.env`, в репозиторий не попадает).
- 8 категорий: claude-code, codex, cursor, junie, local-models, ai-services, prompts-configs, agent-teams.
- 6 опубликованных постов (id 35–40), SEO title/description у всех; `is_featured` — единственный слот в CMS, занят постом 35.
- Проверка: `GET /api/v1/content/posts?locale=ru` → HTTP 200, 6 записей `published`.

## CI (.github/workflows/ci.yml)

- Шаги: `npm ci` (кэш npm по `package-lock.json`) → `npx astro check` → `npm run build`, секреты `BACKEND_API`/`BACKEND_KEY`, `timeout-minutes: 10`.
- Подтверждено: локальная симуляция всех трёх шагов с теми же переменными окружения — 9 секунд (в пределах лимита 10 минут).
- Не подтверждено: реальный прогон hosted-пайплайна — в репозитории нет git remote и коммитов, запуск невозможен до настройки remote и сохранения секретов CI.

## Ограничения

- Результаты выше воспроизводимы командами из этого файла; Playwright используется только для проверки и в зависимости проекта не входит.
