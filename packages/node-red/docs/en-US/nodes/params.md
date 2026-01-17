# Params

Reads or modifies NVRAM parameters and settings.

## Inputs

- **Action** (`msg.topic`):
  - `list`: Get all NVRAM parameters.
  - `get`: Get specific parameters defined in `msg.payload`.
  - `set`: Apply settings defined in `msg.payload`.
- **Payload** (`msg.payload`):
  - For `get`: A string (key) or array of strings (keys).
  - For `set`: An object `{ key: value }`.
- **Options**:
  - `msg.page`: Current ASP page (helper for finding Service IDs).
  - `msg.sid`: Service ID list (required for restarting services).
  - `msg.group`: Group ID (required for list operations).
  - `msg.script`: Action script to execute.
  - `msg.action`: Action mode (e.g., `' Apply '`, `' Add '`, `' Reboot '`).

## Outputs

- `msg.payload`: The requested parameters (for `get`/`list`) or the applied
  configuration (for `set`).

## Details

Use the **Action Mode** field in the editor (or `msg.action`) to control how
parameters are applied (e.g., just change NVRAM, apply changes to a service,
or reboot).
