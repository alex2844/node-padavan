# Status

Retrieve and manage router status


### Input

| msg       | type
| ---       | ---
| `topic`   | string


| topic         | Description
| ---           | ---
| *`status`*    | Get current status
| *`log`*       | Get logs
| *`reboot`*    | Reboot


### Output

| msg       | type      | Value
| ---       | ---       | ---
| `topic`   | string    | status
| `payload` | object    |


| payload   | Description
| ---       | ---
| `lavg`    | System load average over the last 1, 5, and 15 minutes
| `uptime`  | Router uptime
| `ram`     | RAM usage information
| `swap`    | Swap memory status
| `cpu`     | CPU load information
| `wifi2`   | Wi-Fi status on the 2.4 GHz band
| `wifi5`   | Wi-Fi status on the 5 GHz band
| `logmt`   | Timestamp of the last log modification


| uptime    |
| ---       |
| `days`    |
| `hours`   |
| `minutes` |


| ram       | Description
| ---       | ---
| `total`   | Total RAM (in KB)
| `used`    | Used RAM
| `free`    | Free RAM
| `buffers` | RAM used for buffers
| `cached`  | RAM used for cache


| swap      |
| ---       |
| `total`   |
| `used`    |
| `free`    |


| cpu       | Description
| ---       | ---
| `busy`    | Total time the CPU has been busy
| `user`    | Time spent on user processes
| `nice`    | Time spent on processes with modified priority
| `system`  | Time spent on system processes
| `idle`    | Idle time when the CPU was not busy
| `iowait`  | Time spent waiting for I/O operations
| `irq`     | Time spent on hardware interrupt handling
| `sirq`    | Time spent on software interrupt handling
| `total`   | Total units of time since the system started


| wifi\*    | Description
| ---       | ---
| `state`   | Network state
| `guest`   | Guest network state
