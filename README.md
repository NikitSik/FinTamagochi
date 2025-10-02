# Tamagochi API

## О проекте
Tamagochi API — это серверная часть цифрового «тамагочи», написанная на ASP.NET Core 9.0. Сервис обеспечивает REST API для регистрации пользователей, управления состоянием виртуального питомца, выполнения игровых миссий, внутриигровых покупок и отслеживания личных финансов. Приложение использует Entity Framework Core и SQL Server для хранения данных, а также JWT-аутентификацию для защиты приватных эндпоинтов.

## Возможности
- **Регистрация и вход** — пользователи создают аккаунты и получают JWT-токен для доступа к защищённым маршрутам (`POST /api/auth/register`, `POST /api/auth/login`).
- **Питомец и его состояние** — API позволяет узнать текущее состояние питомца, менять активного питомца и выполнять действия (кормление, игры и т.д.) через `api/pet/*` (`GET /api/pet/state`, `POST /api/pet/select`, `POST /api/pet/action`).
- **Магазин** — выдаёт витрину предметов и даёт покупать питомцев, предметы, фоны и расходники (`GET /api/shop/items`, `POST /api/shop/purchase`).
- **Миссии** — предоставляет список миссий, фиксирует прогресс пользователя и выдаёт награды (`GET /api/missions`, `POST /api/missions/{id}/step`, `POST /api/missions/{id}/claim`).
- **Финансы** — помогает вести учёт доходов/расходов, копилки и баланса (`POST /api/finance/snapshot`, `GET /api/finance/snapshot/latest`, операции с балансом и накоплениями).

Полный список маршрутов и моделей доступен в Swagger UI по адресу `/swagger` после запуска приложения.

## Требования
- .NET SDK 9.0
- SQL Server (локальный или сетевой)

## Подготовка окружения
1. Склонируйте репозиторий и перейдите в его корень.
2. Настройте строку подключения `ConnectionStrings:DefaultConnection` в файле `Tamagochi/appsettings.Development.json` или задайте переменную окружения `ConnectionStrings__DefaultConnection`. Пример строки — `Server=localhost\\SQLEXPRESS;Database=TamagochiDb;Trusted_Connection=True;TrustServerCertificate=True;`.
3. Убедитесь, что значения секции `Jwt` (Issuer, Audience, Key) соответствуют требованиям вашего окружения. Ключ должен содержать не менее 32 байт для алгоритма HS256.

## Запуск миграций
При старте приложения вызывается `db.Database.Migrate()`, поэтому база данных будет создана и миграции применятся автоматически. При необходимости вы можете выполнить их вручную:

```bash
dotnet ef database update --project Tamagochi/Tamagochi.csproj
```

## Запуск приложения
```bash
dotnet run --project Tamagochi/Tamagochi.csproj
```

По умолчанию сервер слушает `http://localhost:5087` (HTTP) и `https://localhost:7087` (HTTPS). Swagger UI будет доступен по адресу `http://localhost:5087/swagger`.

## Быстрый сценарий использования
1. Зарегистрируйте нового пользователя: `POST /api/auth/register` c телом `{ "nickname": "demo", "password": "P@ssw0rd" }`.
2. Получите токен через `POST /api/auth/login` и установите заголовок `Authorization: Bearer <token>` в последующих запросах.
3. Получите текущее состояние питомца (`GET /api/pet/state`), выполните действие (`POST /api/pet/action`) или выберите другого питомца (`POST /api/pet/select`).
4. Просмотрите магазин (`GET /api/shop/items`) и купите предмет (`POST /api/shop/purchase`).
5. Выполняйте миссии (`POST /api/missions/{id}/step`) и забирайте награды (`POST /api/missions/{id}/claim`).
6. Фиксируйте финансовые показатели (`POST /api/finance/snapshot`) и управляйте балансом/накоплениями через соответствующие эндпоинты.

## Дополнительно
- Для разработки можно включить фронтенд, указанный в политике CORS (localhost:5173 или localhost:3000).
- Эндпоинт `/whoami` возвращает базовую информацию о текущем пользователе и может помочь в отладке токенов.
- Для просмотра всех зарегистрированных маршрутов есть служебный эндпоинт `/__routes` (только в целях диагностики).
