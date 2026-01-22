# System

Performs system diagnostics and control operations.

## Inputs

- **Action** (`msg.topic`):
  - `status`: Get system status.
  - `log`: Get the system log.
  - `reboot`: Reboot the router.
  - `scan`: Scan for Wi-Fi networks (Site Survey).
  - `doctor`: Analyze Wi-Fi environment and recommend the best channel.
- **Band** (`msg.band`):
  - Used for `scan` and `doctor`.
  - Values: `'2.4'` or `'5'`.

## Outputs

- `msg.payload`: The raw result object from the library.
  - For `status`: A JSON object with raw system data.
  - For `scan`: An array of networks.
  - For `doctor`: An analysis object.
  - For `log`: A string.
- For the `status` action, the message is also enriched with properties:
  - `msg.uptimeStr` (`string`): A formatted uptime string (e.g., "5d 12h 30m").
  - `msg.cpuPercent` (`number` | `null`): Calculated CPU usage.
  - `msg.ramPercent` (`number`): Calculated RAM usage.

## Details

For an accurate `cpuPercent`, the `status` action should be triggered
regularly (e.g., every 5-10 seconds).
