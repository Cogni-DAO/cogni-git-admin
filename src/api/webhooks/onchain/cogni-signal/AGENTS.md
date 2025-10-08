# CogniSignal Webhook Handler

## Purpose
Single endpoint for CogniSignal events from any onchain webhook provider using adapter pattern.

## Scope
- POST `/api/v1/webhooks/onchain/cogni-signal` endpoint
- Provider detection and adapter selection
- Normalized transaction hash extraction
- Provider-agnostic processing

## Current Implementation
- **MVP**: Hardcoded to Alchemy payload format in `src/index.ts`
- **Future Target, not a rush**: Provider adapter pattern with `detectProvider() → adapter.parse()`

## Architecture
```
route.ts → detectProvider() → adapter.parse() → { txHashes: string[] } → RPC verify
```

## Data Flow
1. Receive webhook payload from any provider
2. `detectProvider()` inspects headers/body to identify provider
3. Provider adapter parses payload → `{ txHashes, provider, deliveryId?, receivedAt }`
4. Route processes normalized txHashes with RPC service
5. Return 204 if no adapter matches, 200 if processed

## Provider Status
- **Alchemy**: Currently hardcoded, needs adapter
- **QuickNode**: Future - different JSON shape
- **Helius**: Future - Solana support

## Guidelines
- Never hardcode to one payload format
- Adapters only parse and verify HMAC for their provider
- Keep adapters stateless and unit testable
- Return 204 for unknown providers