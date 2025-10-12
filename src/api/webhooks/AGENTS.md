# Webhook Handlers

## Purpose
HTTP endpoints for receiving webhooks from external services.

## Scope
- Webhook signature verification
- Payload parsing and validation
- Routing to appropriate domain handlers

## Current Implementation
- **GitHub**: Repository event webhooks via Probot
- **Onchain**: Blockchain event webhooks with provider adapters

## Structure
- `github/` - GitHub repository event webhooks
- `onchain/cogni-signal/` - CogniSignal blockchain event webhooks

## Guidelines
- Verify signatures before processing
- Parse and validate payloads
- Delegate business logic to core/services
- Return appropriate HTTP status codes