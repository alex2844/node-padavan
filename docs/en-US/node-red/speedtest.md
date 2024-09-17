# SpeedTest

Measure download and upload speeds


### Output

| outputs       | Description
| ---           | ---
| `result`      | Result
| `history`     | Result with date and timestamp
| `progress`    | Test start and end


| result.msg    | type      | Value
| ---           | ---       | ---
| `topic`       | string    | NetworkControl
| `payload`     | object    |


| payload                   | Description
| ---                       | ---
| `networkDownloadSpeedMbps`| Download speed
| `networkUploadSpeedMbps`  | Upload speed
