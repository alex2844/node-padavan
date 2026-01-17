# node-padavan

[[RU]](./ru/README.md) | [EN]

This is a monorepo for `node-padavan` — a set of tools for managing routers
running **Padavan** firmware. The project provides both a core library for
developers and a ready-to-use integration for Node-RED.

## Repository Structure

This repository contains several packages located in the `packages/` directory:

| Package | NPM | Description |
| --- | --- | --- |
| [`padavan`](../packages/node/) | [![npm](https://img.shields.io/npm/v/padavan.svg)](https://www.npmjs.com/package/padavan) | Core library and CLI tool. |
| [`node-red-contrib-padavan`](../packages/node-red/) | [![npm](https://img.shields.io/npm/v/node-red-contrib-padavan.svg)](https://www.npmjs.com/package/node-red-contrib-padavan) | Node-RED nodes. |

## Development

To work with this monorepo, you will need to install [Bun](https://bun.sh/).

1. **Clone the repository:**

   ```bash
   git clone https://github.com/alex2844/node-padavan.git
   cd node-padavan
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Build packages:**

   ```bash
   bun run build
   ```

4. **Run tests:**

   ```bash
   bun run test
   ```
