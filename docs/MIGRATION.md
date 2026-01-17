# Migration Guide (v1 -> v2)

Version 2.0 is a complete rewrite of the library and Node-RED nodes. The main
change is **moving from SSH to HTTP API**.

## Library (`padavan`)

### Constructor Changes

Configuration is now passed as a nested `credentials` object instead of a flat
list.

**v1.x (Old):**

```javascript
const client = new Padavan({
    host: '192.168.1.1',
    username: 'admin',
    password: 'password'
});
```

**v2.x (New):**

```javascript
const client = new Padavan({
    credentials: {
        host: '192.168.1.1',
        username: 'admin',
        password: 'password'
    },
    logLevel: 'error'
});
```

### Data Structure Changes

- **History**:
  - **v1**: Returned `{ daily_history: [], monthly_history: [] }`. Arrays
    contained raw data (timestamps as integers).
  - **v2**: Returns `{ daily: [], monthly: [] }`. Keys are renamed. Date fields
    are parsed into JavaScript `Date` objects and `dateStr` strings. Data is
    normalized.
- **Devices**:
  - **v1**: Returned `{ hostname, ip, mac, rssi }`.
  - **v2**: Returns `{ mac, ip, hostname, type, rssi }`. The `type` field
    (`eth`, `wifi`, `2.4GHz`, `5GHz`) is new.

### Removed Methods

- **`startSpeedTest()`**: Removed. Use specialized tools for speed testing.

### Changed Methods

- **`exec(command)`**: Now works via the web interface (`SystemCmd`) instead of
  an SSH tunnel. Interactive commands are not supported.
- **`getParams()`**: Added short-term caching (3 seconds) to optimize
  performance when multiple requests occur simultaneously.

---

## Node-RED (`node-red-contrib-padavan`)

### Removed Nodes

- **SpeedTest**: This node has been completely removed.

### Configuration Changes (`padavan-config`)

- Configuration fields (`host`, `username`, `password`) remain the same.
- Internal connection logic changed from SSH to HTTP.

### System Node Changes (`padavan-system`)

- Added new actions: `Scan Wi-Fi` and `Wi-Fi Doctor`.

### Params Node Changes (`padavan-params`)

- **New Options**: The node now supports additional parameters for `set` and
  `get` actions:
  - `Action Mode`: Control how settings are applied (e.g., just apply, reboot,
    add to list).
  - `Service ID`: Specify services to restart after applying settings.
  - `Group ID`: Required for actions `Add` or `Del` when working with lists.
  - `Action Script`: Specify a script to execute.
  - `ASP Page`: Specify the page context. Useful for parsing inputs in `get` or
    automatic Service ID detection in `set`.

### History Node Changes (`padavan-history`)

- **Breaking Change**: `msg.payload` structure changed.
  - Old: `{ daily_history: [...], monthly_history: [...] }`
  - New: `{ daily: [...], monthly: [...] }`
- `msg.networkUsage` and `msg.networkUsageMB` are preserved, but the calculation
  logic is improved: it now falls back to daily statistics if monthly data is
  unavailable.
