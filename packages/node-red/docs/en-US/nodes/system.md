# System

Performs system diagnostics and control operations.

## Inputs

- **Action** (`msg.topic`):
  - `status`: Get system status.
  - `log`: Get the system log.
  - `reboot`: Reboot the router.
  - `scan`: Scan for Wi-Fi networks (Site Survey).
  - `doctor`: Analyze Wi-Fi environment and recommend the best channel.
  - `call`: Execute a low-level system action.
- **Band** (`msg.band`):
  - Used for `scan` and `doctor`.
  - Values: `'2.4'` or `'5'`.
- **System Action** (`msg.action`):
  - Used for `call`.
  - Values: `Reboot`, `ClearLog`, `FreeMemory`, `CommitFlash`, etc.
- `msg.payload` (for `call` action):
  - If the action is `SystemCmd` and payload is a **string**,
    it is executed as a console command.
  - If payload is an **object**, it is sent as POST parameters
    (e.g. `{ action: 'genkey' }` for `wg_action`).

## Outputs

- `msg.payload`: The raw result object from the library.
- For the `status` action, the message is also enriched with properties:
  - `msg.uptimeStr` (`string`): A formatted uptime string (e.g., "5d 12h 30m").
  - `msg.cpuPercent` (`number` | `null`): Calculated CPU usage.
  - `msg.ramPercent` (`number`): Calculated RAM usage.

## Details

For an accurate `cpuPercent`, the `status` action should be triggered
regularly (e.g., every 5-10 seconds).
