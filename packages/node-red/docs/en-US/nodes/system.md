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

- `msg.payload`: The result of the operation.
  - For `status`, the object is enhanced with:
    - `uptimeStr` (`string`): A formatted uptime string (e.g., "5d 12h 30m").
    - `cpuPercent` (`number` | `null`): Calculated CPU usage.
    - `ramPercent` (`number`): Calculated RAM usage.
  - For `scan`, an array of networks.
  - For `doctor`, an analysis object.
  - For `log`, a string.

## Details

The **Wi-Fi Doctor** action analyzes all visible networks, calculates
interference scores, and suggests the optimal channel for your router.
