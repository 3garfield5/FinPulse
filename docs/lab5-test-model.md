# ЛР5: Тестовая модель FinPulse

## 1. Критические пользовательские сценарии

1. Аутентификация:
- Регистрация нового пользователя.
- Вход с корректными и некорректными credentials.
- Обновление access-token через refresh-token.
- Выход и инвалидация refresh-token.

2. Роли и права:
- Доступ к `/admin/users` только при `admin_users:list`.
- Управление ролями только при `admin_users:assign_role`.
- Ограничение `chat:attach_files` для операций с файлами.

3. Работа с чатом:
- Отправка сообщений в default-чат.
- Поведение multi-chat для `pro/admin`.
- Ограничение создания чата для обычного `user`.

4. Работа с файлами:
- Init upload c валидацией mime/size.
- Complete upload с проверкой объекта в S3.
- Получение download-url только для `ready` файлов.
- Удаление только собственного файла.

5. Публичные данные:
- Публичная лента новостей и карточка новости.
- Публичные котировки MOEX с fallback при внешней ошибке.

6. Frontend сценарии:
- Login form: loading/error/success flow.
- Route guards (`RequireAuth/RequirePermission`).
- Админ-таблица: фильтрация/сортировка/пагинация.
- Файлы: загрузка/ошибка/повтор загрузки.

7. E2E сценарии:
- Login -> protected page -> logout.
- CRUD по ролям в админке.
- Фильтрация/пагинация в admin users.
- Upload/download/delete файла по роли.
- Обработка 401 + refresh + повтор запроса.

## 2. Ключевые бизнес-правила

- Пароль хранится в виде SHA-256 hash.
- Refresh токен валидируется по подписи, типу и сроку жизни.
- Permission-check выполняется до бизнес-логики endpoint.
- `chat:attach_files` обязателен для `/files/*`.
- `size_bytes > 10MB` отклоняется кодом `413`.
- Недопустимый mime отклоняется кодом `422`.
- Default chat нельзя удалить (`409`).
- Публичные эндпоинты не требуют токен.

## 3. Области повышенного риска

- Auth/session lifecycle: refresh race, logout и stale-токены.
- RBAC: ошибочные разрешения и обход route-guard.
- File-flow: несогласованность size/mime и S3 объекта.
- Внешние интеграции: MOEX/Scraper/LLM недоступность.
- Ошибки валидации контрактов API (422 schema errors).

## 4. Стратегия тестирования

- Unit: чистая бизнес-логика, без сетевых зависимостей.
- Integration: FastAPI endpoint с dependency override и тестовыми репозиториями.
- Frontend unit/integration: Vitest + RTL + MSW.
- E2E: Playwright smoke-сценарии основных потоков.
- Изоляция: отдельные in-memory storage/fixtures на каждый тест.

## 5. Критерии качества

- Минимум покрытия: backend >= 70%, frontend >= 60%.
- Разделение тестов по маркерам: `unit`, `integration`, `e2e`, `slow`.
- Единый нейминг:
  - backend: `backend/tests/<layer>/test_<feature>.py`
  - frontend: `frontend/src/test/<layer>/<feature>.test.ts(x)`
  - e2e: `frontend/e2e/*.spec.ts`
