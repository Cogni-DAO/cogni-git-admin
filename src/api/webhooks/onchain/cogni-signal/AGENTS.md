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
- Registry returns Alchemy adapter with type-safe verify and parse methods
- Validates required blockchain configuration from `environment` object before processing transactions
- Processes multiple txHashes per webhook, validates chain/DAO against `environment.CHAIN_ID` and `environment.DAO_ADDRESS`
- Executes GitHub actions via extensible registry system with `executeAction()` for valid events

## HTTP Response Codes
- **200 OK**: Valid events processed successfully
- **204 No Content**: No relevant transactions or CogniAction events found (normal for irrelevant webhooks)
- **400 Bad Request**: Unknown webhook provider detected
- **401 Unauthorized**: Signature verification failed
- **422 Unprocessable Entity**: Valid webhook but validation failures (wrong DAO/chain ID)
- **500 Internal Server Error**: Fatal processing error or missing required configuration

## Implementation Details
- Provider detection returns "alchemy" for MVP implementation
- Signature verification uses HMAC validation for Alchemy webhooks
- Configuration validation checks `environment.CHAIN_ID`, `environment.DAO_ADDRESS`, and `environment.SIGNAL_CONTRACT` presence before processing
- Validation errors return detailed messages in response body for debugging
- Each valid CogniAction event triggers GitHub action execution via action registry system

## Architecture
route.ts → detectProvider() → getAdapter() → adapter.verifySignature() → adapter.parse() → RPC verify

## Data Flow
1. `detectProvider()` returns "alchemy" (hardcoded for MVP) → 400 if unknown provider
2. `getAdapter("alchemy")` returns alchemyAdapter from registry
3. `adapter.verifySignature()` validates HMAC → 401 if fails
4. `adapter.parse()` extracts txHashes from webhook payload
5. Return 204 if no transactions found
6. For each txHash: RPC fetch → filter by contract address → parse CogniAction events
7. Validate chainId and DAO address → collect validation errors if mismatches
8. Execute GitHub action via action registry using `executeAction()` for each valid event
9. Response logic:
   - **200**: Valid events processed successfully
   - **422**: Validation failures with detailed error messages
   - **204**: No relevant events found

## Provider Status
- **Alchemy**: Implemented with HMAC signature verification
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