# FinPulse Testing Guide (ЛР5)

## Структура

- Backend unit: `backend/tests/unit/`
- Backend integration: `backend/tests/integration/`
- Frontend unit: `frontend/src/test/unit/`
- Frontend integration: `frontend/src/test/integration/`
- Frontend e2e: `frontend/e2e/`

## Нейминг

- Python: `test_<feature>.py`
- Frontend: `<feature>.test.ts(x)`
- E2E: `<feature>.spec.ts`

## Запуск backend

- Все тесты: `cd backend && make test`
- Unit: `cd backend && make test-unit`
- Integration: `cd backend && make test-integration`
- Coverage: `cd backend && make test-coverage`

## Запуск frontend

- Unit + Integration: `cd frontend && npm run test`
- Unit: `cd frontend && npm run test:unit`
- Integration: `cd frontend && npm run test:integration`
- Coverage: `cd frontend && npm run test:coverage`
- E2E: `cd frontend && npm run test:e2e`

## Пороги качества

- Backend coverage: `>= 70%`
- Frontend coverage: `>= 60%`

## Маркеры backend

- `unit`
- `integration`
- `e2e`
- `slow`

## Изоляция

- Backend integration использует dependency override и in-memory фикстуры.
- Frontend тесты изолированы через mock-слой (`vi.mock`) и `msw` сервер.
- E2E тесты стабилизированы через route mocking Playwright.
