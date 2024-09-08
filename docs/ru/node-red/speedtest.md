# SpeedTest

Измерить скорость скачивания и загрузки


### Выводит

| outputs       | Описание
| ---           | ---
| `result`      | Результат
| `history`     | Результат с датой и timestamp
| `progress`    | Запуск и окончание теста

| result.msg    | type      | Значение
| ---           | ---       | ---
| `topic`       | string    | NetworkControl
| `payload`     | object    |


| payload                   | Описание
| ---                       | ---
| `networkDownloadSpeedMbps`| Скорость скачивания
| `networkUploadSpeedMbps`  | Скорость загрузки
