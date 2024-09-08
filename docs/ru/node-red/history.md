# История

Получить историю трафика


### Выводит

| msg               | type
| ---               | ---
| `payload`         | object
| `networkUsage`    | string
| `networkUsageMB`  | integer


| payload           | type  | Описание
| ---               | ---   | ---
| `daily_history`   | array | Ежедневно
| `monthly_history` | array | Ежемесячно


| \*\_history   | Описание
| ---           | ---
| `0`           | Год, месяц, день
| `1`           | Загрузка
| `2`           | Отдача
