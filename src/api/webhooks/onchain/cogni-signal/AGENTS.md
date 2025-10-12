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
- Executes GitHub actions via extensible registry system with `executeAction()` for valid events

## HTTP Response Codes
- **200 OK**: Valid events processed successfully
- **204 No Content**: No relevant transactions or CogniAction events found (normal for irrelevant webhooks)
- **400 Bad Request**: Unknown webhook provider detected
- **401 Unauthorized**: Signature verification failed
- **422 Unprocessable Entity**: Valid webhook but validation failures (wrong DAO/chain ID)
- **500 Internal Server Error**: Fatal processing error

## Implementation Details
- Provider detection currently returns "alchemy" for MVP implementation
- Signature verification uses HMAC validation for Alchemy webhooks
- Validation errors return detailed messages in response body for debugging
- Each valid CogniAction event triggers GitHub action execution via action registry system

## Architecture
```
route.ts → detectProvider() → getAdapter() → adapter.verifySignature() → adapter.parse() → RPC verify
```

## Data Flow
1. `detectProvider()` returns "alchemy" (hardcoded for MVP) → 400 if unknown provider
2. `getAdapter("alchemy")` returns alchemyAdapter from registry
3. `adapter.verifySignature()` validates HMAC → 401 if fails
4. `adapter.parse()` extracts txHashes from `body.event.data.block.logs[].transaction.hash`
5. Return 204 if txHashes.length === 0
6. For each txHash: RPC fetch → filter by contract address → parse CogniAction events
7. Validate chainId and DAO address → collect validation errors if mismatches
8. Execute GitHub action via extensible action registry system using `executeAction()` for each valid event
9. Response logic:
   - **200**: validEventsFound > 0 (success)
   - **422**: validationErrors.length > 0 (validation failures with details)
   - **204**: No relevant events found (normal case)

**Improvement**: Validation failures now return 422 with detailed error messages instead of generic 204

## Provider Status
- **Alchemy**: Uses `alchemyAdapter` with `verifySignature()` and `parse()` methods
- **QuickNode**: Not implemented
- **Helius**: Not implemented

## Guidelines
- Never hardcode to one payload format
- Adapters only parse and verify HMAC for their provider
- Keep adapters stateless and unit testable
- Use proper HTTP response codes:
  - 400 for unknown providers
  - 422 for validation failures (with detailed error messages)
  - 204 only for successfully processed webhooks with no relevant content