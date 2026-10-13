## 1. Инструменты и каркас

- [ ] 1.1 Добавить `react`, `react-dom`, `@astrojs/react`, `@tanstack/react-query` и подключить интеграцию в `astro.config.mjs`; проверить: `npm ci` и `npm run build` проходят, страницы собираются как раньше
- [ ] 1.2 Настроить `tsconfig.json` (`paths: {"@/*": ["src/*"]}`, `jsx: react-jsx`) и проверить: импорт `@/…` резолвится в `npx astro check`
- [ ] 1.3 Описать схему `astro:env` (`BACKEND_API`, `BACKEND_KEY`: `envField.string({context:'client', access:'public'})`) и создать `src/shared/config/env.ts` с проверкой наличия значений и префикса `pk_`; проверить: сборка с пустым env и с ключом без `pk_` падает, значение ключа в сообщении не выводится
- [ ] 1.4 Создать `shared/config/site.ts` (локаль по умолчанию, имя сайта) и `shared/config/levels.ts` (уровни); проверить: строка `'ru'` и список `LEVELS` встречаются в `src/` только в `shared/config`
- [ ] 1.5 Настроить ESLint (`typescript-eslint`, `eslint-plugin-astro`, `react-hooks`, `import`) с правилами `max-lines: 150`, запретом `../`-импортов, `import/order`, границами слоёв и запретом `fetch`/`import.meta.env` вне `shared/api`/`shared/config`; проверить: `npm run lint` падает на файле-нарушителе и проходит на чистом коде
- [ ] 1.6 Настроить Vitest и скрипт `npm test`; проверить: тест-пример проходит
- [ ] 1.7 Создать каркас папок `app`, `views`, `widgets`, `features`, `entities`, `shared` и проверить: правила границ слоёв в линтере срабатывают на тестовом недопустимом импорте

## 2. Слой доступа к API (`shared/api`)

- [ ] 2.1 Подтвердить доступ к `@cms/api-client` (токен реестра через `.npmrc`/env вне git); если доступа нет — зафиксировать выбор `transport.ts` в `design.md`; проверить: решение записано, токен не попал в git
- [ ] 2.2 Реализовать `errors.ts` (`ApiError`: `code`, `status`, `details`, `traceId`, `retryAfter`) и разбор конверта `{error:{…}}`; проверить: Vitest покрывает `404` с конвертом, сетевой сбой, таймаут
- [ ] 2.3 Реализовать клиент (`client.ts` на `@cms/api-client` либо `transport.ts`) с интерфейсом `Api` (`posts.list`, `posts.bySlug`, `categories.list`), заголовком `X-Api-Key`, `AbortSignal`, таймаутом и повтором `429/503` по `Retry-After`; проверить: Vitest с подменённым `fetch` проверяет заголовок, повтор и исчерпание попыток
- [ ] 2.4 Добавить `getApi()`, `useApi()` и `query-client.ts` (синглтон `queryClient`); проверить: тест — `getApi()` и `useApi()` возвращают один и тот же клиент
- [ ] 2.5 Создать `app/providers/AppProviders.tsx` (общий `queryClient`) и проверить: два острова на странице используют один кэш
- [ ] 2.6 Реализовать `getAllPosts()` и `getCategories()` в `entities` для build-time: обход всех cursor-страниц, предохранительный лимит, `throw` при пустом ответе/ошибке; проверить: Vitest — три страницы курсора дают объединённый список, пустой ответ и превышение лимита выбрасывают ошибку

## 3. Компоненты загрузки (`shared/ui`)

- [ ] 3.1 Реализовать `Spinner` (`role="status"`, подпись) и `Skeleton`/`CardSkeleton` с размерами реальной карточки; проверить: Vitest/`@testing-library` — роль и подпись присутствуют, визуально размеры совпадают с карточкой
- [ ] 3.2 Реализовать `Button` с `loading` (spinner, `aria-busy`, `disabled`, фиксированная ширина); проверить: тест — повторный клик во время загрузки не вызывает обработчик, ширина не меняется
- [ ] 3.3 Реализовать `PageLoader` и общий блок ошибки с «Повторить»; проверить: тест рендерит оба состояния
- [ ] 3.4 Реализовать `widgets/page-progress` (`useIsFetching` + клики по внутренним ссылкам) и добавить его в `BaseLayout`; проверить: во время запроса полоса видна, после завершения скрыта
- [ ] 3.5 Добавить `@media (prefers-reduced-motion: reduce)` для всех анимаций загрузки; проверить: в DevTools с эмуляцией настройки анимации отключены

## 4. Миграция по слоям

- [ ] 4.1 Перенести типы `Post`, `Category`, `Tool` и хелперы (`flattenCategories`, `cardDescription`, `pickFeatured`, `formatDate`) в `entities/material` и `entities/tool`, а `markdown` и `date` — в `shared/lib`; проверить: `npx astro check` без ошибок, Vitest на хелперах проходит
- [ ] 4.2 Вычислять инструмент материала по `primary_category_id`/`categories` вместо `post.path.split('/')`; проверить: тест на материале с нестандартным `path`
- [ ] 4.3 Перенести `MaterialCard` в `entities/material/ui` (с токенами цветов), `SiteNav` — в `widgets/site-nav`, `BaseLayout` — в `app/layouts`; проверить: страницы собираются, визуально без изменений
- [ ] 4.4 Создать `views/home`, `views/catalog`, `views/material` и сократить файлы `src/pages/*` до тонких маршрутов; проверить: ни один файл в `src/pages` не содержит разметки секций и стилей страницы
- [ ] 4.5 Перевести страницы на `getAllPosts()`/`getCategories()` и удалить `src/lib/cms.ts`, `catalog.ts`; проверить: число страниц материалов в `dist/materials/` равно общему числу опубликованных постов по всем cursor-страницам
- [ ] 4.6 Заменить относительные импорты на алиасы `@/`; проверить: `npm run lint` не находит `../`-импортов

## 5. Каталог на React

- [ ] 5.1 Реализовать `shared/lib/url-state` (парсинг и запись `?tool=&level=&q=`) и `useCatalogUrlState()`; проверить: Vitest — восстановление из URL, игнор неизвестных значений, запись без перезагрузки
- [ ] 5.2 Реализовать `useMaterialsInfinite` (`useInfiniteQuery`, `initialPageParam: null`, `getNextPageParam`, `placeholderData`, `signal`) и маппинг фильтров в `category`/`tag`; проверить: Vitest — параметры запроса, переход к следующему курсору, остановка без `next_cursor`
- [ ] 5.3 Реализовать фильтры (`features/catalog-filters`), поиск по загруженным (`features/catalog-search`) и «Показать ещё» (`features/load-more`) на `.tsx` с `Button loading`; проверить: тесты компонентов — кнопка скрыта без `next_cursor`, поиск не делает запросов
- [ ] 5.4 Собрать `widgets/catalog-browser` и `widgets/material-grid` с состояниями: скелетоны, пустой результат со сбросом, ошибка с «Повторить»; подключить остров `client:load` в `views/catalog` с `initialData` и категориями из SSG; проверить: в HTML `/materials/` без JS есть первая порция карточек, после гидрации лишнего запроса нет
- [ ] 5.5 Удалить `FilterBar.astro`, `SearchBox.astro`, `lib/catalog-client.ts`; проверить: в `.astro` нет `<script>` с логикой интерфейса, сборка проходит
- [ ] 5.6 Проверить в браузере: быстрая смена фильтров отменяет прежний запрос, открытие `?tool=…&level=…` восстанавливает фильтры, фокус не теряется при «Показать ещё»

## 6. Markdown и стили

- [ ] 6.1 Покрыть `shared/lib/markdown` тестами (экранирование HTML, `javascript:`-ссылки, код-блоки, списки); принять решение: оставить свой рендер или заменить библиотекой; проверить: тесты проходят, решение записано в `design.md`
- [ ] 6.2 Заменить захардкоженные цвета (`#303a49`, `#d5dce6`, `#080b11` и др.) на токены из `app/styles`; проверить: поиск hex-цветов в `.astro` и компонентных `.css` вне файла токенов даёт 0 совпадений
- [ ] 6.3 Разбить файлы, близкие к лимиту (`[slug].astro`, `design.css`, `home-hero.css`), так, чтобы каждый был ≤150 строк; проверить: проверка `max-lines` проходит без исключений

## 7. CI и финальная проверка

- [ ] 7.1 Добавить в `.github/workflows/ci.yml` шаги `npm run lint` и `npm test` перед `astro check` и `build`; проверить: CI зелёный, а push с файлом >150 строк падает на `lint`
- [ ] 7.2 Прогнать сборку с неверным `BACKEND_KEY` и с пустым ответом CMS; проверить: сборка падает, `dist/` не публикуется
- [ ] 7.3 Статические проверки: нет `fetch(`/`import.meta.env` вне `shared/api`/`shared/config`, нет `../`-импортов, нет файлов >150 строк, нет обращений к `/api/admin/v1/`; проверить: скрипт/линтер возвращает 0 нарушений
- [ ] 7.4 Итоговый прогон `npm run lint`, `npm test`, `npx astro check`, `npm run build` и замер времени CI; проверить: все команды зелёные, push → выкат ≤ 10 минут
- [ ] 7.5 Обновить `openspec/changes/standardize-frontend-architecture` (чекбоксы) и подготовить change к архивации; проверить: `openspec validate standardize-frontend-architecture` проходит
