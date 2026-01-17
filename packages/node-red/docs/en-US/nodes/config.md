# Configuration

Configures connections to the router and GitHub repository.

## Router

Settings for connecting to the Padavan web interface.

- **Host**: IP address or hostname of the router (e.g., `192.168.1.1`).
- **Username**: Administrator username (usually `admin`).
- **Password**: Administrator password.

## Github

Settings for firmware updates and builds. Required only for the `Upgrade` node.

- **Repo**: Repository URL or `owner/repo` string (e.g.,
  `alex2844/padavan-builder`).
- **Branch**: The branch to use for builds and checks (e.g., `main`).
- **Token**: GitHub Personal Access Token (PAT) with access to Actions and
  Artifacts.
