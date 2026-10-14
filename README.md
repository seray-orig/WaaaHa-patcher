# WaaaHa! Patcher

Утилита для создания и правки горячих клавиш Dawn of War: Definitive Edition.
Локальное приложение: сервер на ASP.NET Core поднимает веб-интерфейс и сам
открывает его в браузере. Никакой авторизации и никаких данных наружу.

## Как это работает

Игра при каждом запуске читает все `.lua` файлы из папки профиля и показывает
игроку каждый корректный набор в списке горячих клавиш под именем из поля
`bindings_locstring`. Оригинальные файлы `KEYDEFAULTS*.LUA` неизменяемы, поэтому
приложение создаёт рядом собственный `.lua` и правит только его.

## Сборка и запуск

```
dotnet build WaaaHa!-patcher.slnx
dotnet run --project WaaaHa!-patcher.API
```

Сервер сам выберет свободный порт на `127.0.0.1` и откроет браузер. Чтобы адрес
был постоянным (например, для отладки фронтенда), задайте `WAAAHA_URLS`:

```
set WAAAHA_URLS=http://127.0.0.1:5080
dotnet run --project WaaaHa!-patcher.API
```

Сборка фронтенда запускается автоматически перед сборкой сервера. Вручную:

```
npm install --prefix WaaaHa!-patcher.React
npm run dev --prefix WaaaHa!-patcher.React
```

## Тесты

```
dotnet test WaaaHa!-patcher.API.UnitTests
```

Тесты поднимают временный профиль в системной папке временных файлов (`%TEMP%`
на Windows, `/tmp` на Linux) и проверяют полный цикл «создать → сохранить →
перечитать → удалить». Сборка проекта API дёргает `npm run build`, поэтому
перед первым запуском нужны зависимости фронтенда: `npm ci --prefix
WaaaHa!-patcher.React`.

Четыре теста в `RealProfileFileTests` работают с настоящим файлом
`KEYDEFAULTS_MODERN.LUA` из профиля игрока и запускаются только на машине с
установленной игрой. В CI они исключены:

```
dotnet test WaaaHa!-patcher.API.UnitTests --filter 'Category!=RealProfile'
```

## Раскладка панелей

Какие кнопки стоят в панелях выбранного юнита, можно задать руками — файлом
`WaaaHa!-patcher.React/src/gameData/layouts.ts`. Позиция в панели это индекс в
массиве, начиная с нуля; пустая строка — пустое место.

Проверка опечаток по настоящему файлу игры:

```
node tools/layout.mjs check
```

Скрипт сверит каждый идентификатор с `KEYDEFAULTS_MODERN.LUA` из профиля,
предупредит о повторах в одном разделе и о превышении числа мест. Без него
опечатка не бросила бы ошибку, а просто тихо оставила дырку в панели.

## Где лежат данные

| Что | Путь |
| --- | --- |
| Профили | `%APPDATA%\Relic Entertainment\Dawn of War\Profiles\Profile*` |
| Имя профиля | `ui_name.dat`, иначе `name.dat` (там же Steam ID) |
| Наборы хоткеев | `*.lua` в папке профиля |
| Настройки приложения | `%APPDATA%\WaaaHa-patcher\settings.json` |
| Иконки команд | `WaaaHa!-patcher.React\public\hotkey-images\` |

## Устройство

- `WaaaHa!-patcher.API\Domain\Hotkeys` — формат файла биндингов: разбор,
  сборка, реестр клавиш.
- `WaaaHa!-patcher.API\Domain\Profiles` — профили игрока и файлы наборов.
- `WaaaHa!-patcher.API\Application` — сценарии работы с наборами.
- `WaaaHa!-patcher.API\Controllers` — HTTP API для интерфейса.
- `WaaaHa!-patcher.React` — интерфейс на React + Vite + TypeScript.

Подробности интерфейса и папки с картинками — в `WaaaHa!-patcher.React/README.md`
и `WaaaHa!-patcher.React/public/hotkey-images/README.md`.