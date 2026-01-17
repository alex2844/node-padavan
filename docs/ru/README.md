# node-padavan

[RU] | [[EN]](../README.md)

Это монорепозиторий для `node-padavan` — набора инструментов для управления
роутерами с прошивкой **Padavan**. Проект предоставляет как основную библиотеку
для разработчиков, так и готовую интеграцию для Node-RED.

## Структура репозитория

Этот репозиторий содержит несколько пакетов, расположенных в директории
`packages/`:

| Пакет | NPM | Описание |
| --- | --- | --- |
| [`padavan`](../../packages/node/) | [![npm](https://img.shields.io/npm/v/padavan.svg)](https://www.npmjs.com/package/padavan) | Основная библиотека и CLI. |
| [`node-red-contrib-padavan`](../../packages/node-red/) | [![npm](https://img.shields.io/npm/v/node-red-contrib-padavan.svg)](https://www.npmjs.com/package/node-red-contrib-padavan) | Узлы для Node-RED. |

## Разработка

Для работы с этим монорепозиторием вам потребуется установить
[Bun](https://bun.sh/).

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/alex2844/node-padavan.git
   cd node-padavan
   ```

2. **Установите зависимости:**

   ```bash
   bun install
   ```

3. **Сборка пакетов:**

   ```bash
   bun run build
   ```

4. **Запуск тестов:**

   ```bash
   bun run test
   ```
