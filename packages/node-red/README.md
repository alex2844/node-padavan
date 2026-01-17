# node-red-contrib-padavan

[[RU]](./docs/ru/README.md) | [EN]

A set of [Node-RED](https://nodered.org/) nodes for managing routers running
**Padavan** firmware.

This package uses the `padavan` library to interact with the router via its
web interface (HTTP). It provides tools for monitoring, configuration,
diagnostics, and firmware management.

## Features

- **Full Control**: Manage NVRAM settings, services, and power state via
  HTTP.
- **Monitoring**: Get real-time traffic history (daily/monthly) and system
  status (CPU/RAM/Uptime).
- **Device Tracking**: Retrieve connected clients with smart filtering for
  "ghost" connections (ARP caching).
- **Diagnostics**: Built-in Wi-Fi Scanner and **"Wi-Fi Doctor"** for
  analyzing interference and finding the best channel.
- **Firmware Management**: Check for updates, trigger builds in GitHub
  Actions, and flash the router directly from Node-RED.

## Installation

Install via the Node-RED Manage Palette or run the following command in your
Node-RED user directory:

```bash
npm install node-red-contrib-padavan
```

## Nodes

### ⚙️ Configuration (`padavan-config`)

Configures the connection to the router (IP, Login, Password) and optionally
to GitHub (for firmware updates). Supports secure credential storage.

### 🖥️ System (`padavan-system`)

Performs system operations and diagnostics.

- **Get Status**: CPU load, RAM usage, Uptime.
- **Get Log**: Fetch system logs.
- **Reboot**: Restart the router.
- **Scan Wi-Fi**: Perform a Site Survey (2.4GHz / 5GHz).
- **Wi-Fi Doctor**: Analyze the environment and recommend the optimal channel.

### 📱 Devices (`padavan-devices`)

Lists connected clients.

- Returns IP, MAC, Hostname, Connection Type, and RSSI.
- Calculates changes (added/removed/changed devices) since the last check.
- Filters out temporary Ethernet "ghosts" when devices switch from Wi-Fi.

### 📊 History (`padavan-history`)

Retrieves traffic usage statistics.

- Prioritizes **Monthly** stats for billing cycles.
- Falls back to **Daily** stats if monthly data is missing.
- Provides pre-calculated `networkUsageMB` for easy integration with voice
  assistants (e.g., Google Home).

### 🔧 Params (`padavan-params`)

Low-level access to router settings (NVRAM).

- **List**: Dump all NVRAM variables.
- **Get**: Read specific variables.
- **Set**: Change variables with support for `sid_list` (service restart) and
  custom action modes.

### ☁️ Upgrade (`padavan-upgrade`)

Manages the firmware lifecycle via GitHub Actions.

- **Check Updates**: Compare current version with the latest artifact.
- **Build**: Trigger a new build workflow in your repository.
- **Flash**: Download the artifact and upgrade the router.

## Migration

Upgrading from v1? Check the [Migration Guide](../../docs/MIGRATION.md) for
details on breaking changes and removed features (like SpeedTest).
