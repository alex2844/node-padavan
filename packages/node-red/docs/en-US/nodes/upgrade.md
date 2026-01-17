# Upgrade

Manages firmware lifecycle via GitHub Actions.

## Actions (`msg.topic`)

- **Check Updates** (`changelog`):
  - Checks if a newer firmware version is available in the GitHub repository.
  - Output: Object with `from` (current), `to` (latest), and `messages`
    (commit list).
- **Build Firmware** (`build`):
  - Triggers a new workflow run in the configured GitHub repository.
- **Flash Firmware** (`upgrade`):
  - Downloads the latest successful artifact.
  - Uploads it to the router.
  - Flashes the firmware and reboots the router.

## Requirements

Requires valid **Github** credentials (Repo, Branch, Token) in the
Configuration node.
