# Updates

Manage firmware updates


### Input

| msg       | type
| ---       | ---
| `topic`   | string


| topic         | Description
| ---           | ---
| *`build`*     | Build firmware
| *`changelog`* | List of changes
| *`upgrade`*   | Install firmware


### Output

| msg       | type      | Value
| ---       | ---       | ---
| `topic`   | string    | changelog
| `error`   | string    |
| `payload` | object    |


| payload   | Description
| ---       | ---
| `from_id` | Current firmware
| `to_id`   | Built firmware
| `data`    | Array of changes
