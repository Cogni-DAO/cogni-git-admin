# Alchemy CogniSignal Webhook Fixtures

Captured Alchemy webhook payloads for CogniSignal contract events.

## Purpose
Contains real webhook payloads from Alchemy's Custom Webhooks service when CogniSignal contract events are emitted on-chain. These fixtures enable deterministic testing of the complete webhook processing pipeline without requiring live blockchain interaction.

## Fixture Contents

### CogniAction Event Payloads
Each fixture represents a `CogniAction` event emitted from the CogniSignal contract containing:
- **Blockchain data**: Block hash, number, timestamp, transaction details
- **Event logs**: Decoded CogniAction parameters (DAO, proposal, action type, target repo/PR)
- **Alchemy metadata**: Webhook ID, event ID, sequence numbers, network identifier

### Headers
Preserved Alchemy-specific headers include:
- `x-alchemy-signature`: HMAC signature for webhook verification
- `x-api-key`: Alchemy API key identifier
- Request routing headers from Smee proxy (when captured via proxy)

## Current Fixtures

### `successful-cognisignal-prmerge-trigger-alchemy.json`
**Event**: CogniAction for PR_APPROVE action
- **Target**: PR #121 in `derekg1729/test-repo`
- **DAO**: `0xa38d03ea38c45c1b6a37472d8df78a47c1a31eb5`
- **Proposal ID**: `0xaa36a7` (11155111 in hex)
- **Action**: `PR_APPROVE` with `pull_request` parameter
- **Chain**: Sepolia testnet (chain ID 11155111)
- **Block**: 9367921 (timestamp: 1759917900)

## Usage in E2E Tests
These fixtures are replayed by the E2E test runner (`e2e/e2e-runner.ts`) to verify:
1. Webhook endpoint accepts and processes Alchemy payloads
2. CogniAction events are correctly parsed from blockchain logs
3. GitHub operations are triggered based on decoded actions
4. System handles production-like payloads correctly

## Data Format
Raw webhook bodies are base64-encoded to preserve exact byte sequences, ensuring:
- Cryptographic signatures remain valid
- Binary data is accurately preserved
- Tests use identical payloads to production webhooks

## Capture Process
Fixtures are created using the webhook capture tool:
1. Configure Alchemy Custom Webhooks to send to Smee proxy
2. Run capture server: `npm run dev:capture`
3. Route webhooks through Smee: `npm run smee-capture-chain-events`
4. Trigger on-chain CogniSignal events
5. Fixtures automatically saved with timestamps and metadata