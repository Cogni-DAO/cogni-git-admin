# Webhook Fixtures

Captured webhook payloads for deterministic testing and development.

## Directory Structure
Fixtures are organized by provider and event type:
```
fixtures/
├─ alchemy/           # Alchemy blockchain webhooks
│  └─ CogniSignal/    # CogniSignal contract events
├─ github/            # GitHub webhooks
│  └─ installation/   # GitHub App installation events
└─ unknown/           # Unrecognized webhooks
   └─ unknown_event/  # Events without type detection
```

## Fixture Format
Each fixture is a JSON file containing:
- `id`: Unique webhook identifier
- `received_at`: ISO timestamp of capture
- `method`: HTTP method (typically POST)
- `url`: Original request path
- `provider`: Detected provider (alchemy/github/unknown)
- `headers`: Complete HTTP headers as key-value pairs
- `body_raw_base64`: Base64-encoded raw request body for exact byte preservation

## File Naming Convention
`<timestamp>_<provider>_<event>_<id>.json`
- Timestamp has colons/dots replaced with hyphens
- Provider identifies webhook source
- Event type from webhook headers
- ID is unique identifier from webhook or timestamp

## Usage
1. Captured by `tools/dev/webhook-capture/` during development
2. Replayed in tests using `test/helpers/fixture-replay.ts`
3. Enables deterministic testing of webhook handling logic

## Examples
- `fixtures/alchemy/CogniSignal/successful-cognisignal-prmerge-trigger-alchemy.json`
- `fixtures/github/installation/2025-10-09T07-54-21-885Z_github_installation_*.json`