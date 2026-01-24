# padavan

[[RU]](./docs/ru/README.md) | [EN]

A Node.js library for managing routers running **Padavan** firmware.

It interacts with the router via its **Web Interface (HTTP)**, providing
programmatic access to configuration, diagnostics, and firmware management
functions.

## Migration

Upgrading from v1? Check the [Migration Guide](../../docs/MIGRATION.md) for
details on breaking changes (move from SSH to HTTP, new constructor) and removed
features.

## Installation

```bash
npm install padavan
```

## Usage

```javascript
import Padavan from 'padavan';

const client = new Padavan({
    credentials: {
        host: '192.168.1.1',
        username: 'admin',
        password: 'password'
    },
    logLevel: 'error'
});

// Get system status
const status = await client.getStatus();
console.log(`Uptime: ${status.uptime}`);
```

## Configuration

The constructor accepts a config object with the following properties:

| Property | Description |
| --- | --- |
| `credentials` | Object containing connection details. |
| `logLevel` | Logging level: `'none'`, `'error'`, `'info'`, `'debug'`. |

### Credentials Object

| Property | Description |
| --- | --- |
| `host` | Router IP address or hostname. |
| `username` | Web interface username. |
| `password` | Web interface password. |
| `repo` | GitHub `owner/repo` for firmware updates. |
| `branch` | GitHub branch (e.g., `main`). |
| `token` | GitHub PAT for accessing Actions/Artifacts. |

## API

### System & Diagnostics

- **`getStatus()`**
  Returns CPU load, RAM usage, uptime, and basic Wi-Fi status.
- **`getLog()`**
  Fetches the complete system log.
- **`exec(command)`**
  Executes a system command via the web console emulator (`SystemCmd`).
  *Returns:* Command output (stdout + stderr).
- **`sendAction(action, payload?)`**
  Sends a low-level action to `apply.cgi`.
  *Arguments:* `action` (string, e.g., `' Reboot '`), `payload` (data object).
  *Returns:* Server response (command output or status).
- **`startReboot()`**
  Reboots the router via HTTP command.

### Network & Clients

- **`getDevices()`**
  Returns a list of connected clients from the ARP table and Wi-Fi driver.
  *Properties:* `mac`, `ip`, `hostname`, `type` (eth, wifi, 2.4GHz, 5GHz),
  `rssi`.
- **`getHistory()`**
  Returns traffic statistics.
  *Structure:* `{ daily: [...], monthly: [...] }`.

### Wi-Fi Tools

- **`startScan(band)`**
  Performs a Site Survey (scan).
  *Band:* `'2.4'` or `'5'`.
- **`getBestChannel(band)`**
  **Wi-Fi Doctor**: Scans the environment, calculates interference scores, and
  recommends the optimal channel for your router.

### NVRAM & Settings

- **`getParams(keys?, page?)`**
  Returns NVRAM variables.
  *Arguments:*
  - `keys`: Specific key string or array of keys. If omitted, returns all.
  - `page`: If provided, parses input fields from a specific ASP page HTML instead
    of using `nvram show`.
- **`setParams(params, options?)`**
  Sets NVRAM variables.
  *Options:* `action_mode` (e.g., `' Apply '`), `sid_list` (Service IDs to
  restart), `group_id`, `current_page`.

### Firmware Management

Requires GitHub credentials (`repo`, `branch`, `token`).

- **`findFirmware(model?)`**
  Searches for firmware artifacts in the configured repository network (looks
  into forks).
- **`getChangelog()`**
  Compares the current router version with the latest artifact and returns a list
  of commits.
- **`startBuild()`**
  Triggers a GitHub Actions workflow to build new firmware.
- **`startUpgrade()`**
  Downloads the latest artifact, uploads it to the router, and flashes it.

## CLI

This package includes a CLI tool. See [CLI Documentation](docs/en-US/CLI.md).
