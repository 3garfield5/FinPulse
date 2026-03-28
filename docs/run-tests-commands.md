# Команды запуска тестов FinPulse


## 1) Backend тесты

### Все тесты
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/backend"
make test
```

### Только unit
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/backend"
make test-unit
```

### Только integration
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/backend"
make test-integration
```

### С coverage
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/backend"
make test-coverage
```

## 2) Frontend тесты

### Unit
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/frontend"
npm run test:unit
```

### Integration
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/frontend"
npm run test:integration
```

### Coverage
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/frontend"
npm run test:coverage
```

## 3) E2E (Playwright)

```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/frontend"
npm run test:e2e
```

## 4) Быстрый запуск одной строкой

### Backend (все)
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/backend" && make test
```

### Frontend (unit + integration)
```bash
cd "/Users/garfieldmk/Desktop/study/Разработка полного цикла/FinPulse/frontend" && npm test
```
