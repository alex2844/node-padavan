# Command Line Interface (CLI)

The `padavan` package includes a CLI tool for managing your router directly
from the terminal. It supports system monitoring, configuration, diagnostics,
and firmware management.

## Installation

You can run it using `npx` without installation:

```bash
npx padavan --help
```

Or install it globally:

```bash
npm install -g padavan
padavan --help
```

## Configuration

Connection details can be passed via command-line arguments or Environment
Variables.

### General Arguments

- `--host`: Router IP address (default: `192.168.1.1`).
- `--port`: Router HTTP port (default: `80`).
- `--user`: Web interface username (default: `admin`).
- `--password`: Web interface password (default: `admin`).
- `--json`: Output result as JSON.
- `--verbose`: Enable debug logging.

### Firmware Arguments

Used for `firmware` commands only.

- `--repo`: GitHub repository `owner/repo` (default: `alex2844/node-padavan`).
- `--branch`: GitHub branch to use.
- `--token`: GitHub Personal Access Token (PAT).
- `--model`: Filter by device model (for search).

### Environment Variables

To avoid typing credentials every time, you can export these variables in your
shell:

- `PADAVAN_HOST`
- `PADAVAN_PORT`
- `PADAVAN_USER`
- `PADAVAN_PASSWORD`
- `PADAVAN_REPO`
- `PADAVAN_BRANCH`
- `PADAVAN_TOKEN`
- `PADAVAN_MODEL`

## Commands

### System & Monitor

- **`padavan status`**
  Show CPU load, RAM usage, and uptime.
- **`padavan log`**
  Print the system log.
- **`padavan traffic`**
  Show daily and monthly traffic statistics.
- **`padavan reboot`**
  Reboot the router.
- **`padavan call <action> [payload..]`**
  Execute a low-level system action (`apply.cgi`).
  *Example:* `padavan call SystemCmd ls -la`

### Network & Wi-Fi

- **`padavan devices`**
  List connected clients with IP, MAC, and connection type.
- **`padavan scan [band]`**
  Perform a Wi-Fi Site Survey.
  *Band:* `2.4` (default) or `5`.
- **`padavan doctor [band]`**
  Analyze the Wi-Fi environment and recommend the best channel.

### Settings (NVRAM)

- **`padavan params [keys..]`**
  Get NVRAM variables.
  *Example:* `padavan params rt_ssid rt_channel`
  *Options:* `--page <file.asp>` (parse inputs from a specific page).
- **`padavan set <pairs..>`**
  Set NVRAM variables.
  *Example:* `padavan set rt_ssid=MyWifi rt_channel=auto`
  *Options:*
  - `--action`: Action mode (e.g., `Apply`, `Reboot`).
  - `--sid`: Service ID to restart (e.g., `WLANConfig11b`).
  - `--group`: Group ID (for lists).
  - `--page`: Current page context.

### Firmware

- **`padavan firmware search`**
  Search for firmware artifacts in the repository network.
- **`padavan firmware changelog`**
  Check for updates and show the changelog.
- **`padavan firmware build`**
  Trigger a new build workflow on GitHub.
- **`padavan firmware upgrade`**
  Download the latest artifact and flash the router.
