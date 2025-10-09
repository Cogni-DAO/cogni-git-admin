# CogniSignal Webhook Handler

## Purpose
Single endpoint for CogniSignal events from any onchain webhook provider using adapter pattern.

## Scope
- POST `/api/v1/webhooks/onchain/cogni-signal` endpoint
- Provider detection and adapter selection
- Normalized transaction hash extraction
- Provider-agnostic processing

## Current Implementation
- Uses provider adapter pattern: `detectProvider() → getAdapter() → verifySignature() → parse()`
- `detectProvider()` hardcoded to return "alchemy" (MVP scope)
- Registry returns Alchemy adapter with separate verify and parse methods
- Processes multiple txHashes per webhook, validates chain/DAO, logs valid events

## Architecture
```
route.ts → detectProvider() → getAdapter() → adapter.verifySignature() → adapter.parse() → RPC verify
```

## Data Flow
1. `detectProvider()` returns "alchemy" (hardcoded for MVP)
2. `getAdapter("alchemy")` returns alchemyAdapter from registry
3. `adapter.verifySignature()` validates HMAC → 401 if fails
4. `adapter.parse()` extracts txHashes from `body.event.data.block.logs[].transaction.hash`
5. Return 204 if txHashes.length === 0
6. For each txHash: RPC fetch → filter by contract address → parse CogniAction events
7. Validate chainId and DAO address, log valid events
8. Return 200 if validEventsFound > 0, else 204

## Provider Status
- **Alchemy**: Uses `alchemyAdapter` with `verifySignature()` and `parse()` methods
- **QuickNode**: Not implemented
- **Helius**: Not implemented

## Guidelines
- Never hardcode to one payload format
- Adapters only parse and verify HMAC for their provider
- Keep adapters stateless and unit testable
- Return 204 for unknown providers