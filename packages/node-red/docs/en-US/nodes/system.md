# System

Performs system diagnostics and control operations.

## Inputs

- **Action** (`msg.topic`):
  - `status`: Get system status (CPU, RAM, Uptime).
  - `log`: Get the system log.
  - `reboot`: Reboot the router.
  - `scan`: Scan for Wi-Fi networks (Site Survey).
  - `doctor`: Analyze Wi-Fi environment and recommend the best channel.
- **Band** (`msg.band`):
  - Used for `scan` and `doctor`.
  - Values: `'2.4'` or `'5'`.

## Outputs

- `msg.payload`: The result of the operation (JSON object for status/doctor,
  array for scan, string for log).

## Details

The **Wi-Fi Doctor** action analyzes all visible networks, calculates
interference scores, and suggests the optimal channel for your router.
