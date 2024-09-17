# History

Retrieve traffic history


### Output

| msg               | type
| ---               | ---
| `payload`         | object
| `networkUsage`    | string
| `networkUsageMB`  | integer


| payload           | type  | Description
| ---               | ---   | ---
| `daily_history`   | array | Daily
| `monthly_history` | array | Monthly


| \*\_history   | Description
| ---           | ---
| `0`           | Year, month, day
| `1`           | Download
| `2`           | Upload
